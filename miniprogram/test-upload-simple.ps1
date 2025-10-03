# 简单的上传测试脚本
$testImagePath = "assets\test\1.jpg"
$uploadUrl = "http://localhost:3000/upload"

Write-Host "🧪 开始测试上传功能..."
Write-Host "📸 测试图片: $testImagePath"

# 使用PowerShell的Invoke-RestMethod进行上传
try {
    $form = @{
        photos = Get-Item $testImagePath
    }
    
    Write-Host "📤 正在上传..."
    $response = Invoke-RestMethod -Uri $uploadUrl -Method Post -Form $form
    
    Write-Host "✅ 上传成功!"
    Write-Host "📊 响应数据:"
    $response | ConvertTo-Json -Depth 10
    
    # 提取fileKey用于AI测试
    $fileKeys = $response.files | ForEach-Object { $_.fileKey }
    Write-Host "🔑 文件Keys: $($fileKeys -join ', ')"
    
    # 测试AI分析
    Write-Host "`n🤖 测试AI分析..."
    $aiData = @{
        fileKeys = $fileKeys
        prompt = "请分析这些图片"
    } | ConvertTo-Json
    
    $aiResponse = Invoke-RestMethod -Uri "http://localhost:3000/ai/pick" -Method Post -Body $aiData -ContentType "application/json"
    
    Write-Host "✅ AI分析成功!"
    Write-Host "🎯 分析结果: $($aiResponse.result)"
    
} catch {
    Write-Host "❌ 测试失败: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "📊 状态码: $($_.Exception.Response.StatusCode)"
        Write-Host "📄 错误详情: $($_.Exception.Response.StatusDescription)"
    }
}