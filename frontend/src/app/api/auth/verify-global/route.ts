import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { login, password } = await request.json();

    if (!login || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    // Greenleaf Global format: JSON-in-URL-encoded-data
    const payload = {
      method: "client/visitor/authorize",
      param: {
        login: login,
        passwd: password,
        type: "auth"
      }
    };

    const formData = new URLSearchParams();
    formData.append('data', JSON.stringify(payload));

    const response = await fetch('https://greenleaf-global.com/office-data/request.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    // Success check: If 'code' exists and is not empty, it's usually an error (e.g., 'data-not-found')
    // If auth is successful, it should return a session/user object or at least no error code
    // Success check: If 'code' exists and is not 'ok', it's an error.
    const isError = data.code && data.code.toLowerCase() !== 'ok';
    
    if (isError) {
      return NextResponse.json({ 
        success: false, 
        message: data.message || 'Geçersiz kullanıcı adı veya şifre.',
        code: data.code 
      });
    }

    // If it returns a result object or doesn't have an error code, consider it verified
    return NextResponse.json({ 
      success: true, 
      user: data.result || null 
    });

  } catch (error) {
    console.error('Greenleaf Global Auth Proxy Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Doğrulama servisi şu an kullanılamıyor. Lütfen daha sonra tekrar deneyin.' 
    }, { status: 500 });
  }
}
