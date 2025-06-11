// alist 兼容的阿里云盘授权服务器 - 基于官方 API
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;
    const pathname = url.pathname;
    
    // 应用配置
    const CLIENT_ID = env.ALIYUN_CLIENT_ID || 'd066108b500c49cea65784';
    const CLIENT_SECRET = env.ALIYUN_CLIENT_SECRET || 'd172f7db9a8cc779';
    
    // 阿里云盘官方 API 端点
    const BASE_URL = 'https://openapi.alipan.com';
    const TOKEN_API_URL = `${BASE_URL}/oauth/access_token`;
    const OAUTH_URL = `${BASE_URL}/oauth/authorize`;
    const QRCODE_API_URL = `${BASE_URL}/oauth/authorize/qrcode`;
    const USER_INFO_URL = `${BASE_URL}/adrive/v1.0/user/getDriveInfo`;
    
    // CORS 配置
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, token',
      'Access-Control-Max-Age': '86400',
    };
    
    // 处理 OPTIONS 预检请求
    if (method === 'OPTIONS') {
      return new Response(null, { 
        status: 204,
        headers: corsHeaders 
      });
    }
    
    try {
      // 路由分发
      switch (pathname) {
        case '/':
        case '/index':
          return await handleIndexPage(url, CLIENT_ID);
          
        case '/auth':
          return await handleAuthRequest(CLIENT_ID, CLIENT_SECRET, QRCODE_API_URL, corsHeaders);
          
        case '/check-status':
          return await handleStatusRequest(url, CLIENT_ID, CLIENT_SECRET, TOKEN_API_URL, BASE_URL, corsHeaders);
          
        case '/token':
          // alist 主要调用的接口
          return await handleTokenRequest(request, CLIENT_ID, CLIENT_SECRET, TOKEN_API_URL, corsHeaders);
          
        case '/validate':
          // token 验证接口
          return await handleValidateRequest(request, USER_INFO_URL, corsHeaders);
          
        case '/test-permissions':
          // 权限测试接口 - 测试 alist 常用的 API
          return await handlePermissionTest(request, corsHeaders);
          
        default:
          return new Response(JSON.stringify({ 
            error: 'Not Found',
            message: `Path ${pathname} not found`
          }), { 
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
      }
    } catch (error) {
      console.error('Request handling error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
};

// 处理首页
async function handleIndexPage(url, clientId) {
  const baseUrl = `${url.protocol}//${url.host}`;
  
  const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>阿里云盘授权服务器 - alist 专用</title>
        <link href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            body { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
            }
            .hero { background: transparent; }
            .card { 
                margin: 20px;
                border-radius: 15px;
                box-shadow: 0 15px 35px rgba(0,0,0,.1);
                backdrop-filter: blur(10px);
                background: rgba(255, 255, 255, 0.95);
            }
            .has-text-gradient {
                background: linear-gradient(45deg, #667eea, #764ba2);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            .code-block {
                background: #f5f5f5;
                border-radius: 8px;
                padding: 15px;
                font-family: 'Courier New', monospace;
                font-size: 0.9em;
                overflow-x: auto;
            }
            .endpoint-box {
                border-left: 4px solid #667eea;
                background: #f8f9fa;
                padding: 15px;
                margin: 10px 0;
                border-radius: 0 8px 8px 0;
            }
        </style>
    </head>
    <body>
        <section class="hero is-fullheight">
            <div class="hero-body">
                <div class="container">
                    <div class="columns is-centered">
                        <div class="column is-10">
                            <div class="card">
                                <div class="card-content">
                                    <div class="has-text-centered mb-5">
                                        <figure class="image is-128x128 is-inline-block mb-4">
                                            <img src="https://img.alicdn.com/imgextra/i3/O1CN01qcJZEf1VXF0KBzyNb_!!6000000002662-2-tps-384-92.png" alt="阿里云盘">
                                        </figure>
                                        
                                        <h1 class="title is-2 has-text-gradient">
                                            阿里云盘授权服务器
                                        </h1>
                                        <h2 class="subtitle is-5 has-text-grey">
                                            alist 项目专用 · 基于官方 OpenAPI · 完全兼容标准 OAuth 2.0
                                        </h2>
                                    </div>
                                    
                                    <!-- 快速开始 -->
                                    <div class="columns">
                                        <div class="column is-6">
                                            <div class="box has-background-success-light">
                                                <h4 class="title is-5">
                                                    <i class="fas fa-rocket"></i> 快速开始
                                                </h4>
                                                <div class="content">
                                                    <ol>
                                                        <li><strong>获取 Token：</strong>点击下方按钮开始授权</li>
                                                        <li><strong>扫码登录：</strong>使用阿里云盘 App 扫码</li>
                                                        <li><strong>复制配置：</strong>获得 Refresh Token</li>
                                                        <li><strong>配置 alist：</strong>填入存储设置</li>
                                                    </ol>
                                                </div>
                                                <div class="buttons">
                                                    <a href="/auth" class="button is-success">
                                                        <span class="icon"><i class="fas fa-qrcode"></i></span>
                                                        <span>开始授权</span>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="column is-6">
                                            <div class="box has-background-info-light">
                                                <h4 class="title is-5">
                                                    <i class="fas fa-cog"></i> alist 配置
                                                </h4>
                                                <div class="content">
                                                    <p><strong>驱动类型：</strong>AliyundriveOpen</p>
                                                    <p><strong>OAuth Token URL：</strong></p>
                                                    <div class="code-block">
                                                        ${baseUrl}/token
                                                    </div>
                                                    <p class="help">
                                                        将此 URL 填入 alist 阿里云盘存储的 "OAuth Token URL" 字段
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- API 接口文档 -->
                                    <div class="content">
                                        <h4 class="title is-4">
                                            <i class="fas fa-code"></i> API 接口文档
                                        </h4>
                                        
                                        <div class="endpoint-box">
                                            <h5 class="title is-6">
                                                <span class="tag is-success">POST</span> /token
                                            </h5>
                                            <p><strong>功能：</strong>刷新 Access Token（alist 主要调用接口）</p>
                                            
                                            <p><strong>请求体：</strong></p>
                                            <div class="code-block">
{
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "grant_type": "refresh_token",
  "refresh_token": "your_refresh_token"
}
                                            </div>
                                            
                                            <p><strong>响应：</strong></p>
                                            <div class="code-block">
{
  "token_type": "Bearer",
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGci...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGci...",
  "expires_in": 7200
}
                                            </div>
                                        </div>
                                        
                                        <div class="endpoint-box">
                                            <h5 class="title is-6">
                                                <span class="tag is-info">POST</span> /validate
                                            </h5>
                                            <p><strong>功能：</strong>验证 Access Token 有效性</p>
                                            
                                            <p><strong>请求体：</strong></p>
                                            <div class="code-block">
{
  "access_token": "your_access_token"
}
                                            </div>
                                        </div>
                                        
                                        <div class="endpoint-box">
                                            <h5 class="title is-6">
                                                <span class="tag is-warning">POST</span> /test-permissions
                                            </h5>
                                            <p><strong>功能：</strong>测试 alist 常用 API 的权限</p>
                                            
                                            <p><strong>请求体：</strong></p>
                                            <div class="code-block">
{
  "access_token": "your_access_token"
}
                                            </div>
                                        </div>
                                        
                                        <div class="endpoint-box">
                                            <h5 class="title is-6">
                                                <span class="tag is-warning">GET</span> /auth
                                            </h5>
                                            <p><strong>功能：</strong>启动二维码授权流程</p>
                                        </div>
                                    </div>
                                    
                                    <!-- 集成示例 -->
                                    <div class="content">
                                        <h4 class="title is-4">
                                            <i class="fas fa-terminal"></i> 集成示例
                                        </h4>
                                        
                                        <div class="tabs">
                                            <ul>
                                                <li class="is-active"><a onclick="showTab('curl')">cURL</a></li>
                                                <li><a onclick="showTab('python')">Python</a></li>
                                                <li><a onclick="showTab('javascript')">JavaScript</a></li>
                                            </ul>
                                        </div>
                                        
                                        <div id="curl-tab" class="tab-content">
                                            <div class="code-block">
# 刷新 Token
curl -X POST "${baseUrl}/token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_id": "your_client_id",
    "client_secret": "your_client_secret",
    "grant_type": "refresh_token",
    "refresh_token": "your_refresh_token"
  }'
                                            </div>
                                        </div>
                                        
                                        <div id="python-tab" class="tab-content" style="display: none;">
                                            <div class="code-block">
import requests

def refresh_token(refresh_token):
    response = requests.post("${baseUrl}/token", json={
        "client_id": "your_client_id",
        "client_secret": "your_client_secret", 
        "grant_type": "refresh_token",
        "refresh_token": refresh_token
    })
    return response.json()
                                            </div>
                                        </div>
                                        
                                        <div id="javascript-tab" class="tab-content" style="display: none;">
                                            <div class="code-block">
async function refreshToken(refreshToken) {
  const response = await fetch("${baseUrl}/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: "your_client_id",
      client_secret: "your_client_secret",
      grant_type: "refresh_token", 
      refresh_token: refreshToken
    })
  });
  return await response.json();
}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- 系统信息 -->
                                    <hr>
                                    <div class="columns is-vcentered">
                                        <div class="column">
                                            <div class="content is-small has-text-grey">
                                                <p><strong>服务信息：</strong></p>
                                                <ul>
                                                    <li>服务地址: <code>${baseUrl}</code></li>
                                                    <li>Client ID: <code>${clientId}</code></li>
                                                    <li>API 基础地址: <code>https://openapi.alipan.com</code></li>
                                                    <li>支持协议: OAuth 2.0</li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div class="column is-narrow">
                                            <div class="content has-text-centered">
                                                <p class="is-size-7 has-text-grey">
                                                    Powered by Cloudflare Workers<br>
                                                    基于阿里云盘官方 OpenAPI
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        
        <script>
            function showTab(tabName) {
                // 隐藏所有标签内容
                document.querySelectorAll('.tab-content').forEach(tab => {
                    tab.style.display = 'none';
                });
                
                // 移除所有活动状态
                document.querySelectorAll('.tabs li').forEach(li => {
                    li.classList.remove('is-active');
                });
                
                // 显示选中的标签
                document.getElementById(tabName + '-tab').style.display = 'block';
                
                // 添加活动状态
                event.target.parentElement.classList.add('is-active');
            }
        </script>
    </body>
    </html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// 处理授权请求 - 生成二维码
async function handleAuthRequest(clientId, clientSecret, qrcodeApiUrl, corsHeaders) {
  try {
    console.log('Generating QR code with params:', {
      clientId: clientId,
      timestamp: new Date().toISOString()
    });
    
    const qrRequestBody = {
      client_id: clientId,
      client_secret: clientSecret,
      scopes: ['user:base', 'file:all:read', 'file:all:write'],
      width: 400,
      height: 400
    };
    
    console.log('QR code request body:', qrRequestBody);
    
    const qrResponse = await fetch(qrcodeApiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(qrRequestBody)
    });
    
    const responseText = await qrResponse.text();
    console.log('QR code response:', {
      status: qrResponse.status,
      statusText: qrResponse.statusText,
      body: responseText
    });
    
    if (!qrResponse.ok) {
      let errorInfo;
      try {
        errorInfo = JSON.parse(responseText);
      } catch (e) {
        errorInfo = { message: responseText };
      }
      throw new Error(`QR code generation failed: ${qrResponse.status} - ${errorInfo.message || responseText}`);
    }
    
    let qrData;
    try {
      qrData = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Invalid QR code response JSON: ${responseText}`);
    }
    
    console.log('QR code data:', qrData);
    
    if (!qrData.qrCodeUrl || !qrData.sid) {
      throw new Error(`Invalid QR response - missing qrCodeUrl or sid: ${JSON.stringify(qrData)}`);
    }
    
    const sid = qrData.sid;
    const qrCodeUrl = qrData.qrCodeUrl;
    const qrID = qrCodeUrl.split('/qrcode/')[1];
    
    if (!qrID) {
      throw new Error(`Could not extract QR ID from URL: ${qrCodeUrl}`);
    }
    
    console.log('QR code generated successfully:', {
      sid: sid,
      qrID: qrID,
      qrCodeUrl: qrCodeUrl
    });
    
    const html = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>阿里云盘授权 - 正在跳转</title>
          <link href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css" rel="stylesheet">
          <style>
              body { 
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  min-height: 100vh;
              }
              .hero-body { text-align: center; }
              .card {
                  background: rgba(255, 255, 255, 0.95);
                  backdrop-filter: blur(10px);
                  border-radius: 15px;
              }
          </style>
      </head>
      <body>
          <section class="hero is-fullheight">
              <div class="hero-body">
                  <div class="container">
                      <div class="columns is-centered">
                          <div class="column is-6">
                              <div class="card">
                                  <div class="card-content">
                                      <h1 class="title has-text-primary">
                                          <i class="fas fa-spinner fa-spin"></i> 正在跳转
                                      </h1>
                                      <h2 class="subtitle">
                                          正在跳转到授权状态检查页面...
                                      </h2>
                                      <progress class="progress is-primary" max="100">60%</progress>
                                      <p class="help">
                                          Session ID: ${sid}<br>
                                          如果页面没有自动跳转，请检查浏览器设置
                                      </p>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </section>
          <script src="https://kit.fontawesome.com/your-fontawesome-kit.js"></script>
      </body>
      </html>
    `;
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Refresh': `0; url=/check-status?sid=${sid}&qrid=${qrID}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error('Auth request error:', error);
    return new Response(JSON.stringify({ 
      error: 'QR_GENERATION_FAILED',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// 处理状态检查请求
async function handleStatusRequest(url, clientId, clientSecret, tokenApiUrl, baseUrl, corsHeaders) {
  const sid = url.searchParams.get('sid');
  const qrID = url.searchParams.get('qrid');
  
  if (!sid || !qrID) {
    return new Response(JSON.stringify({
      error: 'MISSING_PARAMETERS',
      message: 'Missing required parameters: sid and qrid'
    }), { 
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
  
  // 获取当前请求的基础URL
  const currentOrigin = `${url.protocol}//${url.host}`;
  
  try {
    // 检查二维码状态
    console.log('Checking QR code status:', {
      sid: sid,
      qrID: qrID,
      statusUrl: `${baseUrl}/oauth/qrcode/${sid}/status`,
      timestamp: new Date().toISOString()
    });
    
    const statusResponse = await fetch(`${baseUrl}/oauth/qrcode/${sid}/status`);
    
    const statusResponseText = await statusResponse.text();
    console.log('Status check response:', {
      status: statusResponse.status,
      statusText: statusResponse.statusText,
      body: statusResponseText
    });
    
    if (!statusResponse.ok) {
      throw new Error(`Status check failed: ${statusResponse.status} - ${statusResponseText}`);
    }
    
    let statusData;
    try {
      statusData = JSON.parse(statusResponseText);
    } catch (e) {
      throw new Error(`Invalid status response JSON: ${statusResponseText}`);
    }
    
    const status = statusData.status;
    console.log('Current status:', {
      status: status,
      fullData: statusData
    });
    
    if (status === 'LoginSuccess') {
      // 登录成功，使用授权码换取token
      const authCode = statusData.authCode;
      
      if (!authCode) {
        throw new Error('No auth code received from login success');
      }
      
      console.log('Attempting to exchange auth code:', {
        authCode: authCode,
        clientId: clientId,
        timestamp: new Date().toISOString()
      });
      
      // 添加重试机制处理可能的时序问题
      let tokenData = null;
      let lastError = null;
      const maxRetries = 3;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Token exchange attempt ${attempt}/${maxRetries}`);
          
          // 如果不是第一次尝试，等待一小段时间
          if (attempt > 1) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
          
          // 构建token交换请求
          const tokenRequestBody = {
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'authorization_code',
            code: authCode
          };
          
          console.log(`Token exchange request body (attempt ${attempt}):`, tokenRequestBody);
          
          const tokenResponse = await fetch(tokenApiUrl, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'User-Agent': 'Cloudflare-Workers/1.0'
            },
            body: JSON.stringify(tokenRequestBody)
          });
          
          const responseText = await tokenResponse.text();
          console.log(`Token exchange response (attempt ${attempt}):`, {
            status: tokenResponse.status,
            statusText: tokenResponse.statusText,
            body: responseText
          });
          
          if (tokenResponse.ok) {
            try {
              tokenData = JSON.parse(responseText);
              if (tokenData.access_token) {
                console.log('Token exchange successful on attempt', attempt);
                break; // 成功，退出重试循环
              } else {
                throw new Error(`No access_token in response: ${JSON.stringify(tokenData)}`);
              }
            } catch (parseError) {
              throw new Error(`Invalid JSON response: ${responseText}`);
            }
          } else {
            // 解析错误响应
            let errorInfo;
            try {
              errorInfo = JSON.parse(responseText);
            } catch (e) {
              errorInfo = { message: responseText };
            }
            
            // 如果是InvalidCode错误且还有重试次数，继续重试
            if (errorInfo.code === 'InvalidCode' && attempt < maxRetries) {
              console.log(`InvalidCode error on attempt ${attempt}, will retry`);
              lastError = new Error(`Attempt ${attempt}: Token exchange failed - ${errorInfo.message || responseText}`);
              continue; // 继续下一次重试
            } else {
              // 其他错误或用完重试次数，直接抛出错误
              let detailedError = `Token exchange failed: ${tokenResponse.status}`;
              if (errorInfo.code === 'InvalidCode') {
                detailedError += ' - 授权码无效或已过期，请重新扫码授权';
              } else if (errorInfo.code === 'InvalidClientSecret') {
                detailedError += ' - 客户端密钥错误';
              } else if (errorInfo.code === 'AppNotExists') {
                detailedError += ' - 应用不存在';
              } else {
                detailedError += ` - ${errorInfo.message || responseText}`;
              }
              
              throw new Error(detailedError);
            }
          }
        } catch (fetchError) {
          console.error(`Attempt ${attempt} failed:`, fetchError);
          lastError = fetchError;
          
          // 如果是网络错误且还有重试次数，继续重试
          if (attempt < maxRetries) {
            continue;
          } else {
            throw fetchError;
          }
        }
      }
      
      // 如果所有重试都失败了
      if (!tokenData) {
        throw lastError || new Error('All token exchange attempts failed');
      }
      
      if (!tokenData.access_token) {
        throw new Error(`Invalid token response: ${JSON.stringify(tokenData)}`);
      }
      
      const refreshToken = tokenData.refresh_token || '';
      const accessToken = tokenData.access_token || '';
      const expiresIn = tokenData.expires_in || 7200;
      
      const html = generateSuccessPage(refreshToken, accessToken, expiresIn, currentOrigin);
      
      return new Response(html, {
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          ...corsHeaders
        }
      });
      
    } else {
      // 还未登录成功，显示二维码页面
      const html = generateWaitingPage(baseUrl, qrID, sid, status);
      
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Refresh': `10; url=/check-status?sid=${sid}&qrid=${qrID}`,
          'Cache-Control': 'no-cache',
          ...corsHeaders
        }
      });
    }
    
  } catch (error) {
    console.error('Status request error:', error);
    
    const errorHtml = generateErrorPage(error.message);
    
    return new Response(errorHtml, {
      status: 500,
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        ...corsHeaders
      }
    });
  }
}

// alist 调用的主要接口：Token 刷新
async function handleTokenRequest(request, clientId, clientSecret, tokenApiUrl, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ 
      error: 'invalid_request',
      error_description: 'Only POST method is allowed'
    }), {
      status: 405,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
  
  try {
    let body;
    const contentType = request.headers.get('content-type') || '';
    
    // 安全地读取请求体
    let rawBody;
    try {
      rawBody = await request.text();
      
      // 简单打印请求体用于调试
      console.log('=== DEBUG: Received request body ===');
      console.log('Content-Type:', contentType);
      console.log('Raw body:', rawBody);
      console.log('Body length:', rawBody.length);
      console.log('======================================');
      
    } catch (e) {
      console.error('Failed to read request body:', e);
      return new Response(JSON.stringify({
        error: 'invalid_request',
        error_description: 'Failed to read request body'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // 检查是否为空
    if (!rawBody || rawBody.trim() === '') {
      return new Response(JSON.stringify({
        error: 'invalid_request',
        error_description: 'Request body is empty'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // 解析请求体
    if (contentType.includes('application/json')) {
      try {
        body = JSON.parse(rawBody);
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError, 'Raw body:', rawBody);
        return new Response(JSON.stringify({
          error: 'invalid_request',
          error_description: 'Invalid JSON format'
        }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
        });
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      try {
        const formData = new URLSearchParams(rawBody);
        body = Object.fromEntries(formData);
      } catch (formError) {
        console.error('Form data parse error:', formError);
        return new Response(JSON.stringify({
          error: 'invalid_request',
          error_description: 'Invalid form data format'
        }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
    } else {
      // 尝试作为JSON解析
      try {
        body = JSON.parse(rawBody);
      } catch (e) {
        console.error('Default JSON parse failed:', e);
        return new Response(JSON.stringify({
          error: 'invalid_request',
          error_description: 'Unsupported content type or invalid format'
        }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
    }
    
    console.log('Parsed request body:', body);
    
    const { 
      client_id, 
      client_secret, 
      grant_type, 
      refresh_token 
    } = body;
    
    // 验证必需参数
    if (!grant_type) {
      return new Response(JSON.stringify({ 
        error: 'invalid_request',
        error_description: 'grant_type is required'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    if (grant_type !== 'refresh_token') {
      return new Response(JSON.stringify({ 
        error: 'unsupported_grant_type',
        error_description: 'Only refresh_token grant type is supported'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    if (!refresh_token) {
      return new Response(JSON.stringify({ 
        error: 'invalid_request',
        error_description: 'refresh_token is required'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // 简单验证refresh_token格式（应该是JWT格式）
    if (typeof refresh_token !== 'string' || refresh_token.length < 10) {
      return new Response(JSON.stringify({
        error: 'invalid_token',
        error_description: 'refresh_token format is invalid'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // 检查是否是占位符
    if (refresh_token === 'your_refresh_token' || refresh_token.includes('your_') || refresh_token.includes('placeholder')) {
      return new Response(JSON.stringify({
        error: 'invalid_token',
        error_description: 'Please provide a valid refresh_token, not a placeholder'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // 构建刷新请求（兼容可选的 client_id/client_secret）
    const tokenRequestBody = {
      client_id: client_id || clientId,
      client_secret: client_secret || clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    };
    
    console.log('Calling Aliyun API with:', {
      client_id: tokenRequestBody.client_id,
      grant_type: tokenRequestBody.grant_type,
      refresh_token_length: refresh_token.length,
      timestamp: new Date().toISOString()
    });
    
    // 调用阿里云盘官方API刷新token
    const tokenResponse = await fetch(tokenApiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Cloudflare-Workers/1.0'
      },
      body: JSON.stringify(tokenRequestBody)
    });
    
    const responseText = await tokenResponse.text();
    console.log('Aliyun API response:', {
      status: tokenResponse.status,
      statusText: tokenResponse.statusText,
      body: responseText
    });
    
    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Aliyun API response:', parseError);
      return new Response(JSON.stringify({
        error: 'server_error',
        error_description: 'Invalid response from authorization server'
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    if (!tokenResponse.ok) {
      console.error('Token refresh failed:', tokenData);
      
      // 根据阿里云盘错误码返回标准 OAuth 错误
      let oauthError = 'invalid_token';
      let errorDescription = tokenData.message || 'Token refresh failed';
      
      switch (tokenData.code) {
        case 'InvalidRefreshToken':
          oauthError = 'invalid_token';
          errorDescription = 'The refresh token is invalid or expired';
          break;
        case 'InvalidClientSecret':
          oauthError = 'invalid_client';
          errorDescription = 'Invalid client credentials';
          break;
        case 'AppNotExists':
          oauthError = 'invalid_client';
          errorDescription = 'Application does not exist';
          break;
        default:
          oauthError = 'server_error';
      }
      
      return new Response(JSON.stringify({
        error: oauthError,
        error_description: errorDescription,
        aliyun_error: tokenData // 包含原始错误信息用于调试
      }), {
        status: tokenResponse.status,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // 检查响应数据
    if (!tokenData.access_token) {
      return new Response(JSON.stringify({
        error: 'server_error',
        error_description: 'Invalid response from authorization server - no access_token'
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // 返回标准的 OAuth 2.0 格式响应（alist 期望的格式）
    const response = {
      token_type: 'Bearer',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in || 7200
    };
    
    // 记录成功的刷新请求（可选）
    console.log('Token refresh success:', {
      client_id: client_id || clientId,
      expires_in: response.expires_in,
      timestamp: new Date().toISOString()
    });
    
    return new Response(JSON.stringify(response), {
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error('Token request error:', error);
    return new Response(JSON.stringify({
      error: 'server_error',
      error_description: error.message
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// 权限测试接口 - 测试 alist 常用的 API
async function handlePermissionTest(request, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ 
      error: 'invalid_request',
      error_description: 'Only POST method is allowed'
    }), {
      status: 405,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
  
  try {
    const { access_token } = await request.json();
    
    if (!access_token) {
      return new Response(JSON.stringify({ 
        error: 'invalid_request',
        error_description: 'access_token is required'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    console.log('Testing permissions for alist integration');
    
    // alist 常用的 API 端点
    const testAPIs = [
      {
        name: 'get_user_info',
        url: 'https://openapi.alipan.com/adrive/v1.0/user/getDriveInfo',
        method: 'POST',
        body: {}
      },
      {
        name: 'get_space_info',
        url: 'https://openapi.alipan.com/adrive/v1.0/user/getSpaceInfo',
        method: 'POST', 
        body: {}
      },
      {
        name: 'list_root_files',
        url: 'https://openapi.alipan.com/adrive/v1.0/openFile/list',
        method: 'POST',
        body: {
          drive_id: '',  // 这里需要动态获取
          parent_file_id: 'root',
          limit: 10,
          all: false,
          url_expire_sec: 1600,
          fields: '*'
        }
      },
      {
        name: 'create_folder_test',
        url: 'https://openapi.alipan.com/adrive/v1.0/openFile/create',
        method: 'POST',
        body: {
          drive_id: '',  // 这里需要动态获取
          parent_file_id: 'root',
          name: '_alist_permission_test_' + Date.now(),
          type: 'folder',
          check_name_mode: 'refuse'
        }
      }
    ];
    
    const results = [];
    let driveId = null;
    
    // 首先获取用户的 drive_id
    try {
      const driveInfoResponse = await fetch('https://openapi.alipan.com/adrive/v1.0/user/getDriveInfo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      if (driveInfoResponse.ok) {
        const driveInfo = await driveInfoResponse.json();
        driveId = driveInfo.default_drive_id;
        console.log('Got drive_id:', driveId);
      }
    } catch (e) {
      console.error('Failed to get drive_id:', e);
    }
    
    // 测试各个API
    for (const api of testAPIs) {
      try {
        // 如果需要 drive_id，填入获取到的值
        const requestBody = { ...api.body };
        if (requestBody.drive_id === '' && driveId) {
          requestBody.drive_id = driveId;
        }
        
        console.log(`Testing API: ${api.name}`);
        
        const testResponse = await fetch(api.url, {
          method: api.method,
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
        
        const responseText = await testResponse.text();
        let responseData;
        
        try {
          responseData = JSON.parse(responseText);
        } catch (e) {
          responseData = { raw_response: responseText };
        }
        
        const result = {
          api: api.name,
          url: api.url,
          status: testResponse.status,
          success: testResponse.ok,
          response: responseData,
          error: testResponse.ok ? null : responseData
        };
        
        results.push(result);
        console.log(`API ${api.name} result:`, result);
        
        // 如果是创建测试文件夹成功，尝试删除它
        if (api.name === 'create_folder_test' && testResponse.ok && responseData.file_id) {
          try {
            await fetch('https://openapi.alipan.com/adrive/v1.0/openFile/delete', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                drive_id: driveId,
                file_id: responseData.file_id
              })
            });
            console.log('Cleaned up test folder');
          } catch (cleanupError) {
            console.log('Failed to cleanup test folder:', cleanupError);
          }
        }
        
      } catch (fetchError) {
        const result = {
          api: api.name,
          url: api.url,
          status: 'network_error',
          success: false,
          response: null,
          error: fetchError.message
        };
        
        results.push(result);
        console.error(`API ${api.name} network error:`, fetchError);
      }
    }
    
    // 分析结果
    const summary = {
      total_tests: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      permission_denied: results.filter(r => 
        r.response && (
          r.response.code === 'PermissionDenied' || 
          r.response.message?.includes('permission') ||
          r.response.message?.includes('Permission')
        )
      ).length
    };
    
    const finalResult = {
      summary,
      drive_id: driveId,
      test_results: results,
      recommendations: generateRecommendations(results)
    };
    
    return new Response(JSON.stringify(finalResult, null, 2), {
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error('Permission test error:', error);
    return new Response(JSON.stringify({
      error: 'server_error',
      error_description: error.message
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// 生成建议
function generateRecommendations(results) {
  const recommendations = [];
  
  const failedAPIs = results.filter(r => !r.success);
  
  if (failedAPIs.length === 0) {
    recommendations.push("✅ 所有测试的API都正常工作，权限配置正确");
  } else {
    recommendations.push("❌ 发现权限问题:");
    
    failedAPIs.forEach(api => {
      if (api.response && api.response.code === 'PermissionDenied') {
        recommendations.push(`  - ${api.api}: 权限被拒绝 - 需要检查应用权限配置`);
      } else if (api.status === 404) {
        recommendations.push(`  - ${api.api}: API端点不存在 - 可能需要更新API路径`);
      } else if (api.status === 401) {
        recommendations.push(`  - ${api.api}: Token无效或过期`);
      } else {
        recommendations.push(`  - ${api.api}: ${api.error || '未知错误'}`);
      }
    });
    
    recommendations.push("\n🔧 建议解决方案:");
    recommendations.push("1. 检查阿里云盘开放平台的应用权限配置");
    recommendations.push("2. 确认应用已申请所有必要的权限范围");
    recommendations.push("3. 重新授权获取包含完整权限的token");
    recommendations.push("4. 联系阿里云盘开放平台技术支持");
  }
  
  return recommendations;
}
async function handleValidateRequest(request, userInfoUrl, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ 
      error: 'invalid_request',
      error_description: 'Only POST method is allowed'
    }), {
      status: 405,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
  
  try {
    const { access_token } = await request.json();
    
    if (!access_token) {
      return new Response(JSON.stringify({ 
        error: 'invalid_request',
        error_description: 'access_token is required'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    console.log('Validating access token:', {
      token_length: access_token.length,
      token_prefix: access_token.substring(0, 20) + '...',
      timestamp: new Date().toISOString()
    });
    
    // 使用多个API端点尝试验证token
    const testEndpoints = [
      // 用户基本信息接口
      'https://openapi.alipan.com/adrive/v1.0/user/get',
      // 获取网盘信息接口  
      'https://openapi.alipan.com/adrive/v1.0/user/getDriveInfo',
      // 获取用户空间信息
      'https://openapi.alipan.com/adrive/v1.0/user/getSpaceInfo'
    ];
    
    let isValid = false;
    let userInfo = null;
    let lastError = null;
    let successEndpoint = null;
    
    for (const endpoint of testEndpoints) {
      try {
        console.log(`Testing endpoint: ${endpoint}`);
        
        const validateResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({}) // 空的JSON对象
        });
        
        const responseText = await validateResponse.text();
        console.log(`Response from ${endpoint}:`, {
          status: validateResponse.status,
          statusText: validateResponse.statusText,
          body: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '')
        });
        
        if (validateResponse.ok) {
          try {
            userInfo = JSON.parse(responseText);
            isValid = true;
            successEndpoint = endpoint;
            console.log('Token validation successful with endpoint:', endpoint);
            break; // 找到有效的端点，退出循环
          } catch (parseError) {
            console.log(`Parse error for ${endpoint}:`, parseError);
            // 即使解析失败，如果状态码是200，也认为token有效
            isValid = true;
            successEndpoint = endpoint;
            userInfo = { message: 'Token valid but response parse failed' };
            break;
          }
        } else {
          // 记录错误但继续尝试下一个端点
          let errorInfo;
          try {
            errorInfo = JSON.parse(responseText);
          } catch (e) {
            errorInfo = { message: responseText };
          }
          lastError = errorInfo;
          console.log(`Endpoint ${endpoint} failed:`, errorInfo);
        }
      } catch (fetchError) {
        console.log(`Network error for ${endpoint}:`, fetchError);
        lastError = { message: fetchError.message };
      }
    }
    
    // 如果所有端点都失败，尝试一个简单的GET请求
    if (!isValid) {
      try {
        console.log('Trying GET request to user info endpoint');
        const simpleValidateResponse = await fetch('https://openapi.alipan.com/adrive/v1.0/user/get', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Accept': 'application/json'
          }
        });
        
        const simpleResponseText = await simpleValidateResponse.text();
        console.log('Simple GET response:', {
          status: simpleValidateResponse.status,
          body: simpleResponseText.substring(0, 200)
        });
        
        if (simpleValidateResponse.ok) {
          isValid = true;
          successEndpoint = 'https://openapi.alipan.com/adrive/v1.0/user/get (GET)';
          try {
            userInfo = JSON.parse(simpleResponseText);
          } catch (e) {
            userInfo = { message: 'Token valid (GET method)' };
          }
        }
      } catch (e) {
        console.log('Simple GET request also failed:', e);
      }
    }
    
    const result = { 
      valid: isValid,
      status: isValid ? 200 : 400,
      user_info: userInfo,
      validation_details: {
        success_endpoint: successEndpoint,
        tested_endpoints: testEndpoints.length,
        last_error: lastError
      }
    };
    
    console.log('Final validation result:', result);
    
    return new Response(JSON.stringify(result), {
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error('Validate request error:', error);
    return new Response(JSON.stringify({
      error: 'server_error',
      error_description: error.message
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// 生成成功页面
function generateSuccessPage(refreshToken, accessToken, expiresIn, currentOrigin) {
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>阿里云盘授权成功</title>
        <link href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            body { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
            }
            .container { margin-top: 50px; }
            .card {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 15px;
                box-shadow: 0 15px 35px rgba(0,0,0,.1);
            }
            .token-text { 
                font-family: 'Courier New', monospace; 
                font-size: 0.8em;
                word-break: break-all;
                line-height: 1.4;
            }
            .copy-success {
                background-color: #48c774 !important;
                border-color: #48c774 !important;
                color: white !important;
            }
        </style>
    </head>
    <body>
        <section class="section">
            <div class="container">
                <div class="columns is-centered">
                    <div class="column is-8">
                        <div class="card">
                            <div class="card-content">
                                <div class="has-text-centered mb-5">
                                    <span class="icon is-large has-text-success">
                                        <i class="fas fa-check-circle fa-3x"></i>
                                    </span>
                                    <h1 class="title is-3 has-text-success">授权成功！</h1>
                                    <p class="subtitle">请复制下面的配置信息到 alist</p>
                                </div>
                                
                                <!-- Refresh Token -->
                                <div class="box has-background-success-light">
                                    <h5 class="title is-5">
                                        <i class="fas fa-key"></i> Refresh Token
                                        <span class="tag is-success is-pulled-right">必需</span>
                                    </h5>
                                    <div class="field has-addons">
                                        <div class="control is-expanded">
                                            <textarea id="refreshToken" class="textarea token-text" rows="4" readonly>${refreshToken}</textarea>
                                        </div>
                                        <div class="control">
                                            <button id="copyRefreshButton" class="button is-success">
                                                <span class="icon"><i class="fas fa-copy"></i></span>
                                                <span>复制</span>
                                            </button>
                                        </div>
                                    </div>
                                    <p class="help">
                                        <i class="fas fa-info-circle"></i> 
                                        有效期 90 天，用于获取新的 Access Token
                                    </p>
                                </div>
                                
                                <!-- Access Token -->
                                ${accessToken ? `
                                <div class="box has-background-info-light">
                                    <h5 class="title is-5">
                                        <i class="fas fa-ticket-alt"></i> Access Token
                                        <span class="tag is-info is-pulled-right">可选</span>
                                    </h5>
                                    <div class="field has-addons">
                                        <div class="control is-expanded">
                                            <textarea id="accessToken" class="textarea token-text" rows="4" readonly>${accessToken}</textarea>
                                        </div>
                                        <div class="control">
                                            <button id="copyAccessButton" class="button is-info">
                                                <span class="icon"><i class="fas fa-copy"></i></span>
                                                <span>复制</span>
                                            </button>
                                        </div>
                                    </div>
                                    <p class="help">
                                        <i class="fas fa-clock"></i> 
                                        有效期 ${Math.round(expiresIn / 3600)} 小时，用于 API 调用
                                    </p>
                                </div>
                                ` : ''}
                                
                                <!-- alist 配置说明 -->
                                <div class="notification is-warning is-light">
                                    <h6 class="title is-6">
                                        <i class="fas fa-cog"></i> alist 配置步骤
                                    </h6>
                                    <div class="content">
                                        <ol>
                                            <li>在 alist 管理界面选择 <strong>"添加存储"</strong></li>
                                            <li>驱动选择 <strong>"AliyundriveOpen"</strong></li>
                                            <li>将上面的 <strong>Refresh Token</strong> 粘贴到对应字段</li>
                                            <li>OAuth Token URL 填入: <code id="tokenUrl">${currentOrigin}/token</code> 
                                                <button onclick="copyTokenUrl()" class="button is-small is-outlined">
                                                    <span class="icon is-small"><i class="fas fa-copy"></i></span>
                                                </button>
                                            </li>
                                            <li>保存配置即可开始使用</li>
                                        </ol>
                                    </div>
                                </div>
                                
                                <div class="buttons is-centered mt-5">
                                    <button class="button is-primary" onclick="window.location.href='/'">
                                        <span class="icon"><i class="fas fa-home"></i></span>
                                        <span>返回首页</span>
                                    </button>
                                    <button class="button is-light" onclick="window.location.href='/auth'">
                                        <span class="icon"><i class="fas fa-redo"></i></span>
                                        <span>重新授权</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        
        <script>
            function copyToClipboard(elementId, buttonId) {
                const element = document.getElementById(elementId);
                const button = document.getElementById(buttonId);
                
                element.select();
                element.setSelectionRange(0, 99999);
                
                try {
                    document.execCommand('copy');
                    const originalHTML = button.innerHTML;
                    button.innerHTML = '<span class="icon"><i class="fas fa-check"></i></span><span>已复制</span>';
                    button.classList.add('copy-success');
                    
                    setTimeout(() => {
                        button.innerHTML = originalHTML;
                        button.classList.remove('copy-success');
                    }, 2000);
                } catch (err) {
                    alert('复制失败，请手动复制');
                }
            }
            
            function copyTokenUrl() {
                const tokenUrl = '${currentOrigin}/token';
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(tokenUrl).then(() => {
                        // 可以添加提示
                        alert('Token URL 已复制到剪贴板');
                    }).catch(() => {
                        // 降级方案
                        fallbackCopyTextToClipboard(tokenUrl);
                    });
                } else {
                    // 降级方案
                    fallbackCopyTextToClipboard(tokenUrl);
                }
            }
            
            function fallbackCopyTextToClipboard(text) {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.top = "0";
                textArea.style.left = "0";
                textArea.style.position = "fixed";
                
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                try {
                    document.execCommand('copy');
                    alert('Token URL 已复制到剪贴板');
                } catch (err) {
                    alert('复制失败，请手动复制: ' + text);
                }
                
                document.body.removeChild(textArea);
            }
            
            document.getElementById('copyRefreshButton').addEventListener('click', function() {
                copyToClipboard('refreshToken', 'copyRefreshButton');
            });
            
            const copyAccessButton = document.getElementById('copyAccessButton');
            if (copyAccessButton) {
                copyAccessButton.addEventListener('click', function() {
                    copyToClipboard('accessToken', 'copyAccessButton');
                });
            }
        </script>
    </body>
    </html>
  `;
}

// 生成等待页面
function generateWaitingPage(baseUrl, qrID, sid, status) {
  const qrImageUrl = `${baseUrl}/oauth/qrcode/${qrID}`;
  const statusText = getStatusText(status);
  const statusClass = getStatusClass(status);
  
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>等待阿里云盘授权</title>
        <link href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            body { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
            }
            .container { margin-top: 50px; text-align: center; }
            .card {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 15px;
                box-shadow: 0 15px 35px rgba(0,0,0,.1);
            }
            .qr-container { 
                background: white; 
                border-radius: 15px; 
                padding: 20px; 
                display: inline-block;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
            .status-animation {
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
        </style>
    </head>
    <body>
        <section class="section">
            <div class="container">
                <div class="columns is-centered">
                    <div class="column is-6">
                        <div class="card">
                            <div class="card-content">
                                <h1 class="title">
                                    <i class="fas fa-mobile-alt"></i> 阿里云盘授权
                                </h1>
                                
                                <div class="qr-container mb-4">
                                    <figure class="image is-256x256">
                                        <img src="${qrImageUrl}" alt="授权二维码" style="border-radius: 8px;"/>
                                    </figure>
                                </div>
                                
                                <div class="notification ${statusClass} status-animation">
                                    ${statusText}
                                </div>
                                
                                <div class="content">
                                    <p class="has-text-grey">
                                        或者点击 <a href="https://www.aliyundrive.com/o/oauth/authorize?sid=${sid}" target="_blank" class="has-text-weight-bold">
                                          此链接
                                        </a> 在浏览器中授权
                                    </p>
                                </div>
                                
                                <div class="buttons is-centered mt-4">
                                    <button class="button is-info" onclick="window.location.reload()">
                                        <span class="icon"><i class="fas fa-sync"></i></span>
                                        <span>刷新状态</span>
                                    </button>
                                    <button class="button is-light" onclick="window.location.href='/auth'">
                                        <span class="icon"><i class="fas fa-qrcode"></i></span>
                                        <span>重新生成</span>
                                    </button>
                                </div>
                                
                                <progress class="progress is-small is-primary mt-4" max="100">60%</progress>
                                <p class="help">页面将每 10 秒自动刷新检查授权状态</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </body>
    </html>
  `;
}

// 生成错误页面
function generateErrorPage(errorMessage) {
  // 判断错误类型并提供相应的解决方案
  let errorType = 'unknown';
  let solution = '请重新开始授权流程';
  let technicalInfo = errorMessage;
  
  if (errorMessage.includes('InvalidCode') || errorMessage.includes('code not found')) {
    errorType = 'code_expired';
    solution = '授权码已过期或无效，请重新扫码授权';
    technicalInfo = '这通常是因为授权码有效期只有10分钟，且只能使用一次';
  } else if (errorMessage.includes('InvalidClientSecret')) {
    errorType = 'client_error';
    solution = '客户端配置错误，请联系管理员检查配置';
    technicalInfo = '客户端密钥验证失败';
  } else if (errorMessage.includes('QR code generation failed')) {
    errorType = 'qr_error';
    solution = '二维码生成失败，请稍后重试';
    technicalInfo = '可能是网络问题或服务暂时不可用';
  }
  
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>授权出错</title>
        <link href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            body { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
            }
            .card {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 15px;
            }
            .error-code {
                font-family: 'Courier New', monospace;
                font-size: 0.8em;
                word-break: break-word;
            }
        </style>
    </head>
    <body>
        <section class="section">
            <div class="container">
                <div class="columns is-centered">
                    <div class="column is-8">
                        <div class="card">
                            <div class="card-content has-text-centered">
                                <span class="icon is-large has-text-danger">
                                    <i class="fas fa-exclamation-triangle fa-3x"></i>
                                </span>
                                <h1 class="title is-4 has-text-danger">授权过程中出现错误</h1>
                                
                                <div class="notification is-danger is-light">
                                    <h6 class="title is-6">
                                        <i class="fas fa-bug"></i> 错误类型: ${errorType}
                                    </h6>
                                    <p><strong>建议解决方案：</strong></p>
                                    <p>${solution}</p>
                                </div>
                                
                                ${errorType === 'code_expired' ? `
                                <div class="notification is-info is-light">
                                    <h6 class="title is-6">
                                        <i class="fas fa-lightbulb"></i> 为什么会出现这个错误？
                                    </h6>
                                    <div class="content has-text-left">
                                        <ul>
                                            <li>阿里云盘的授权码有效期只有 <strong>10分钟</strong></li>
                                            <li>每个授权码只能使用 <strong>一次</strong></li>
                                            <li>如果页面停留时间过长或网络延迟，授权码可能已失效</li>
                                            <li>多次刷新页面也可能导致授权码被重复使用</li>
                                        </ul>
                                    </div>
                                </div>
                                ` : ''}
                                
                                <div class="buttons is-centered mb-4">
                                    <button class="button is-primary is-large" onclick="window.location.href='/auth'">
                                        <span class="icon"><i class="fas fa-redo"></i></span>
                                        <span>重新开始授权</span>
                                    </button>
                                    <button class="button is-light" onclick="window.location.href='/'">
                                        <span class="icon"><i class="fas fa-home"></i></span>
                                        <span>返回首页</span>
                                    </button>
                                </div>
                                
                                <details class="mt-4">
                                    <summary class="button is-small is-outlined">
                                        <span class="icon is-small"><i class="fas fa-code"></i></span>
                                        <span>查看技术详情</span>
                                    </summary>
                                    <div class="box mt-3 has-background-light">
                                        <h6 class="title is-6">技术信息：</h6>
                                        <p class="error-code">${technicalInfo}</p>
                                        <hr>
                                        <p class="error-code"><strong>完整错误：</strong><br>${errorMessage}</p>
                                        <p class="help mt-2">
                                            <strong>时间：</strong> ${new Date().toLocaleString('zh-CN')}<br>
                                            <strong>提示：</strong> 如果问题持续存在，请截图此页面并联系技术支持
                                        </p>
                                    </div>
                                </details>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </body>
    </html>
  `;
}

// 辅助函数
function getStatusText(status) {
  switch (status) {
    case 'WaitLogin':
      return '<i class="fas fa-mobile-alt"></i> 请使用阿里云盘 App 扫描二维码';
    case 'ScanSuccess':
      return '<i class="fas fa-check"></i> 扫码成功，请在手机上确认授权';
    case 'QRCodeExpired':
      return '<i class="fas fa-clock"></i> 二维码已过期，请重新生成';
    default:
      return '<i class="fas fa-spinner fa-spin"></i> 正在检测状态...';
  }
}

function getStatusClass(status) {
  switch (status) {
    case 'WaitLogin':
      return 'is-warning';
    case 'ScanSuccess':
      return 'is-info';
    case 'QRCodeExpired':
      return 'is-danger';
    default:
      return 'is-light';
  }
}
