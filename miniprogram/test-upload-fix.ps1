# 测试修复后的图片上传和URL生成
Write-Host "🧪 测试修复后的图片上传和URL生成" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

$API_BASE = "http://localhost:5000"

# 1. 健康检查
Write-Host "1. 检查服务器状态..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$API_BASE/health" -Method Get
    if ($healthResponse.ok) {
        Write-Host "✅ 服务器运行正常" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ 服务器连接失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. 测试签名URL生成
Write-Host "2. 测试签名URL生成..." -ForegroundColor Yellow
try {
    $signedUrlData = @{
        fileKey = "test-file-key-123"
        type = "preview"
    } | ConvertTo-Json
    
    $signedUrlResponse = Invoke-RestMethod -Uri "$API_BASE/upload/signed-url" -Method Post -Body $signedUrlData -ContentType "application/json"
    
    Write-Host "📋 签名URL结果:" -ForegroundColor Cyan
    Write-Host "- URL: $($signedUrlResponse.url)" -ForegroundColor White
    
    # 验证URL是否使用正确的端口
    if ($signedUrlResponse.url -like "*localhost:5000*") {
        Write-Host "✅ 签名URL 使用正确端口 5000" -ForegroundColor Green
    } else {
        Write-Host "❌ 签名URL 端口错误: $($signedUrlResponse.url)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ 签名URL测试失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 测试完成！" -ForegroundColor Green