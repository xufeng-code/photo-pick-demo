const axios = require('axios');

async function getImageBase64(url) {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer'
        });
        
        const buffer = Buffer.from(response.data);
        const base64 = buffer.toString('base64');
        
        console.log(`data:image/jpeg;base64,${base64}`);
        return base64;
    } catch (error) {
        console.error('获取图片失败:', error.message);
    }
}

// 获取测试图片
getImageBase64('https://dashscope.oss-cn-beijing.aliyuncs.com/images/dog_and_girl.jpeg');