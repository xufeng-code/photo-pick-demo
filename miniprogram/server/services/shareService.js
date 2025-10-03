const { v4: uuidv4 } = require('uuid');
const { query, get, run } = require('../database/init');
const imageProcessor = require('../utils/imageProcessor');
const signedUrl = require('../utils/signedUrl');

class ShareService {
  // 生成分享链接（一键分享）
  async generateShareLink({ sessionId, file, title, description }) {
    try {
      // 处理上传的图片
      const photoResult = await imageProcessor.processImage(file.buffer, file.originalname);
      
      // 生成分享ID
      const shareId = uuidv4();
      
      // 保存图片信息到数据库
      const photoId = uuidv4();
      await run(`
        INSERT INTO photos (id, file_key, original_name, size, width, height, original_path, preview_path, thumb_path, session_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        photoId,
        photoResult.fileKey,
        photoResult.originalName,
        photoResult.size,
        photoResult.width,
        photoResult.height,
        photoResult.paths.original,
        photoResult.paths.preview,
        photoResult.paths.thumb,
        sessionId
      ]);

      // 创建分享记录
      await run(`
        INSERT INTO shares (id, session_id, photo_id, title, description, likes_count, comments_count)
        VALUES (?, ?, ?, ?, ?, 0, 0)
      `, [shareId, sessionId, photoId, title, description]);

      // 生成分享链接
      const shareUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/share/${shareId}`;
      
      // 生成签名URL
      const originalUrl = signedUrl.generateSignedUrl(photoResult.paths.original, 60);
      const previewUrl = signedUrl.generateSignedUrl(photoResult.paths.preview, 60);
      
      return {
        shareId,
        shareUrl,
        title,
        description,
        photo: {
          id: photoId,
          fileKey: photoResult.fileKey,
          originalName: photoResult.originalName,
          size: photoResult.size,
          width: photoResult.width,
          height: photoResult.height,
          urls: {
            original: originalUrl.url,
            preview: previewUrl.url,
            thumb: `/files/${photoResult.paths.thumb}`
          }
        },
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('生成分享链接失败:', error);
      throw error;
    }
  }

  // 获取分享详情（朋友页面使用）
  async getShareDetails(shareId) {
    try {
      // 获取分享基本信息
      const shareInfo = await get(`
        SELECT s.*, p.file_key, p.original_name, p.size, p.width, p.height,
               p.original_path, p.preview_path, p.thumb_path
        FROM shares s
        JOIN photos p ON s.photo_id = p.id
        WHERE s.id = ?
      `, [shareId]);

      if (!shareInfo) {
        throw new Error('分享不存在');
      }

      // 生成签名URL
      const originalUrl = signedUrl.generateSignedUrl(shareInfo.original_path, 60);
      const previewUrl = signedUrl.generateSignedUrl(shareInfo.preview_path, 60);

      // 获取评论列表
      const comments = await all(`
        SELECT id, content, author_name, created_at
        FROM comments
        WHERE share_id = ?
        ORDER BY created_at DESC
      `, [shareId]);

      return {
        id: shareInfo.id,
        title: shareInfo.title,
        description: shareInfo.description,
        likesCount: shareInfo.likes_count,
        commentsCount: shareInfo.comments_count,
        photo: {
          id: shareInfo.photo_id,
          fileKey: shareInfo.file_key,
          originalName: shareInfo.original_name,
          size: shareInfo.size,
          width: shareInfo.width,
          height: shareInfo.height,
          urls: {
            original: originalUrl.url,
            preview: previewUrl.url,
            thumb: `/files/${shareInfo.thumb_path}`
          }
        },
        comments,
        createdAt: shareInfo.created_at
      };
    } catch (error) {
      console.error('获取分享详情失败:', error);
      throw error;
    }
  }

  // 点赞功能
  async toggleLike(shareId, userIdentifier) {
    try {
      // 检查是否已经点赞
      const existingLike = await get(`
        SELECT id FROM likes WHERE share_id = ? AND user_identifier = ?
      `, [shareId, userIdentifier]);

      if (existingLike) {
        // 取消点赞
        await run(`DELETE FROM likes WHERE id = ?`, [existingLike.id]);
        await run(`UPDATE shares SET likes_count = likes_count - 1 WHERE id = ?`, [shareId]);
        return { liked: false };
      } else {
        // 添加点赞
        await run(`
          INSERT INTO likes (id, share_id, user_identifier, created_at)
          VALUES (?, ?, ?, datetime('now'))
        `, [uuidv4(), shareId, userIdentifier]);
        await run(`UPDATE shares SET likes_count = likes_count + 1 WHERE id = ?`, [shareId]);
        return { liked: true };
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
      throw error;
    }
  }

  // 添加评论
  async addComment(shareId, { content, authorName }) {
    try {
      const commentId = uuidv4();
      await run(`
        INSERT INTO comments (id, share_id, content, author_name, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `, [commentId, shareId, content, authorName]);

      // 更新评论数量
      await run(`UPDATE shares SET comments_count = comments_count + 1 WHERE id = ?`, [shareId]);

      // 返回新评论
      const newComment = await get(`
        SELECT id, content, author_name, created_at
        FROM comments
        WHERE id = ?
      `, [commentId]);

      return newComment;
    } catch (error) {
      console.error('添加评论失败:', error);
      throw error;
    }
  }

  // 创建分享
  async createShare({ sessionId, bestPhotoId, files }) {
    try {
      const shareId = uuidv4();
      const processedPhotos = [];

      // 处理上传的图片
      for (const file of files) {
        const photoResult = await imageProcessor.processImage(file.buffer, file.originalname);
        
        // 保存图片信息到数据库
        const photoId = uuidv4();
        await run(`
          INSERT INTO photos (id, file_key, original_name, size, width, height, original_path, preview_path, thumb_path, session_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          photoId,
          photoResult.fileKey,
          photoResult.originalName,
          photoResult.size,
          photoResult.width,
          photoResult.height,
          photoResult.paths.original,
          photoResult.paths.preview,
          photoResult.paths.thumb,
          sessionId
        ]);

        // 生成访问URL
        const originalUrl = signedUrl.generateSignedUrl(photoResult.paths.original, 30);
        const previewUrl = signedUrl.generateSignedUrl(photoResult.paths.preview, 30);
        const thumbUrl = `/files/${photoResult.paths.thumb}`; // 缩略图公开访问

        processedPhotos.push({
          id: photoId,
          fileKey: photoResult.fileKey,
          originalName: photoResult.originalName,
          size: photoResult.size,
          width: photoResult.width,
          height: photoResult.height,
          urls: {
            original: originalUrl.url,
            preview: previewUrl.url,
            thumb: thumbUrl
          }
        });
      }

      // 如果没有指定最佳照片，使用第一张
      const finalBestPhotoId = bestPhotoId || processedPhotos[0]?.id;

      // 保存分享信息
      await run(`
        INSERT INTO shares (id, session_id, photos_data, best_photo_id)
        VALUES (?, ?, ?, ?)
      `, [
        shareId,
        sessionId,
        JSON.stringify(processedPhotos),
        finalBestPhotoId
      ]);

      return {
        shareId,
        sessionId,
        photos: processedPhotos,
        bestPhotoId: finalBestPhotoId,
        shareUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/share/${shareId}`,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('创建分享失败:', error);
      throw error;
    }
  }

  // 切换点赞状态
  async toggleLike({ shareId, photoId, userId }) {
    try {
      // 检查分享是否存在
      const share = await get('SELECT id FROM shares WHERE id = ?', [shareId]);
      if (!share) {
        throw new Error('分享不存在');
      }

      // 检查是否已经点赞
      const existingLike = await get(`
        SELECT id FROM likes WHERE share_id = ? AND photo_id = ? AND user_id = ?
      `, [shareId, photoId, userId]);

      let isLiked;
      if (existingLike) {
        // 取消点赞
        await run('DELETE FROM likes WHERE id = ?', [existingLike.id]);
        isLiked = false;
      } else {
        // 添加点赞
        await run(`
          INSERT INTO likes (share_id, photo_id, user_id)
          VALUES (?, ?, ?)
        `, [shareId, photoId, userId]);
        isLiked = true;
      }

      // 获取总点赞数
      const likeCount = await get(`
        SELECT COUNT(*) as count FROM likes WHERE share_id = ? AND photo_id = ?
      `, [shareId, photoId]);

      return {
        isLiked,
        likeCount: likeCount.count,
        photoId,
        shareId
      };
    } catch (error) {
      console.error('切换点赞状态失败:', error);
      throw error;
    }
  }

  // 添加评论
  async addComment({ shareId, photoId, author, content }) {
    try {
      // 检查分享是否存在
      const share = await get('SELECT id FROM shares WHERE id = ?', [shareId]);
      if (!share) {
        throw new Error('分享不存在');
      }

      const commentId = uuidv4();
      await run(`
        INSERT INTO comments (id, share_id, photo_id, author, content)
        VALUES (?, ?, ?, ?, ?)
      `, [commentId, shareId, photoId, author, content]);

      return {
        id: commentId,
        shareId,
        photoId,
        author,
        content,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('添加评论失败:', error);
      throw error;
    }
  }

  // 获取分享数据
  async getShareData(shareId) {
    try {
      // 获取分享基本信息
      const share = await get(`
        SELECT * FROM shares WHERE id = ?
      `, [shareId]);

      if (!share) {
        return null;
      }

      // 解析照片数据
      const photos = JSON.parse(share.photos_data);

      // 为每张照片重新生成签名URL（防止过期）
      const photosWithFreshUrls = await Promise.all(photos.map(async (photo) => {
        const photoData = await get('SELECT * FROM photos WHERE id = ?', [photo.id]);
        if (photoData) {
          const originalUrl = signedUrl.generateSignedUrl(photoData.original_path, 30);
          const previewUrl = signedUrl.generateSignedUrl(photoData.preview_path, 30);
          const thumbUrl = `/files/${photoData.thumb_path}`;

          return {
            ...photo,
            urls: {
              original: originalUrl.url,
              preview: previewUrl.url,
              thumb: thumbUrl
            }
          };
        }
        return photo;
      }));

      // 获取点赞数据
      const likes = await query(`
        SELECT photo_id, COUNT(*) as count 
        FROM likes 
        WHERE share_id = ? 
        GROUP BY photo_id
      `, [shareId]);

      // 获取评论数据
      const comments = await query(`
        SELECT * FROM comments 
        WHERE share_id = ? 
        ORDER BY created_at DESC
      `, [shareId]);

      // 组织点赞数据
      const likesMap = {};
      likes.forEach(like => {
        likesMap[like.photo_id] = like.count;
      });

      // 组织评论数据
      const commentsMap = {};
      comments.forEach(comment => {
        if (!commentsMap[comment.photo_id]) {
          commentsMap[comment.photo_id] = [];
        }
        commentsMap[comment.photo_id].push({
          id: comment.id,
          author: comment.author,
          content: comment.content,
          createdAt: comment.created_at
        });
      });

      return {
        shareId: share.id,
        sessionId: share.session_id,
        photos: photosWithFreshUrls,
        bestPhotoId: share.best_photo_id,
        likes: likesMap,
        comments: commentsMap,
        createdAt: share.created_at,
        updatedAt: share.updated_at
      };
    } catch (error) {
      console.error('获取分享数据失败:', error);
      throw error;
    }
  }

  // 删除分享（可选功能）
  async deleteShare(shareId) {
    try {
      // 获取分享信息
      const share = await get('SELECT * FROM shares WHERE id = ?', [shareId]);
      if (!share) {
        throw new Error('分享不存在');
      }

      // 删除相关的点赞和评论
      await run('DELETE FROM likes WHERE share_id = ?', [shareId]);
      await run('DELETE FROM comments WHERE share_id = ?', [shareId]);

      // 删除照片文件
      const photos = JSON.parse(share.photos_data);
      for (const photo of photos) {
        const photoData = await get('SELECT * FROM photos WHERE id = ?', [photo.id]);
        if (photoData) {
          await imageProcessor.deleteImage(photoData.file_key);
          await run('DELETE FROM photos WHERE id = ?', [photo.id]);
        }
      }

      // 删除分享记录
      await run('DELETE FROM shares WHERE id = ?', [shareId]);

      return { success: true };
    } catch (error) {
      console.error('删除分享失败:', error);
      throw error;
    }
  }
}

module.exports = new ShareService();