// دریافت کد احراز هویت
window.addEventListener('message', async (event) => {
  if (event.data.type === 'linkedin_auth') {
    const token = await getAccessToken(event.data.code);
    if (token) {
      const profile = await fetchProfileData(token);
      if (profile) {
        localStorage.setItem('linkedin_token', token);
        localStorage.setItem('linkedin_profile', JSON.stringify(profile));
        displayProfile(profile);
      }
    }
  }
});

// دریافت توکن دسترسی
async function getAccessToken(code) {
  try {
    const response = await fetch('https://localhost:3000/auth', { // نیاز به سرور backend
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code,
        client_id: LINKEDIN_CONFIG.CLIENT_ID,
        client_secret: LINKEDIN_CONFIG.CLIENT_SECRET,
        redirect_uri: decodeURIComponent(LINKEDIN_CONFIG.REDIRECT_URI),
        grant_type: 'authorization_code'
      })
    });
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('خطا در دریافت توکن:', error);
    showToast('خطا در ارتباط با سرور', 'error');
    return null;
  }
}

// دریافت اطلاعات پروفایل
async function fetchProfileData(token) {
  try {
    const [profileRes, emailRes] = await Promise.all([
      fetch('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Connection': 'Keep-Alive'
        }
      }),
      fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Connection': 'Keep-Alive'
        }
      })
    ]);
    
    const profile = await profileRes.json();
    const email = await emailRes.json();
    
    return {
      id: profile.id,
      name: `${profile.localizedFirstName} ${profile.localizedLastName}`,
      email: email.elements[0]['handle~'].emailAddress,
      headline: profile.headline,
      picture: profile.profilePicture?.displayImage
    };
  } catch (error) {
    console.error('خطا در دریافت پروفایل:', error);
    showToast('خطا در دریافت اطلاعات کاربر', 'error');
    return null;
  }
}
