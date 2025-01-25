const clientId    = '760tl57va0f4esqlrn9kdprdqe';
const domain      = 'https://eu-central-1jasxje83x.auth.eu-central-1.amazoncognito.com';
const redirectUri = 'https://winding.surge.sh/';
const scope       = "email+openid+phone";

const poolData = {
    UserPoolId: 'eu-central-1_jaSxje83x',
    ClientId: '760tl57va0f4esqlrn9kdprdqe',
  };
  
  const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

function login(username, password) {
    console.log("login");
    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
        Username: username,
        Password: password,
    });

    const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
        Username: username,
        Pool: userPool,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
            console.log('Access token:', result.getAccessToken().getJwtToken());
            // Сохраните токен для будущих запросов
            localStorage.setItem('accessToken', result.getAccessToken().getJwtToken());
        },
        onFailure: (err) => {
            console.error(err);
        },
    });
}

const logInButton = document.getElementById('logIn');
logInButton.addEventListener('click', () => {
    const loginUrl = `${domain}/login?client_id=${clientId}&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = loginUrl; 
});


function decodeJwt(token) {
    const base64Url = token.split('.')[1]; // Извлекаем вторую часть токена (payload)
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join('')
    );
    return JSON.parse(jsonPayload); // Парсим payload
  }
  
function cognitoOnLoad() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  let access_token = localStorage.getItem('accessToken');
  let id_token = localStorage.getItem('idToken');

  if (code) {
    // console.log("code", code)
    axios.post(`${domain}/oauth2/token`, new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code: code,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }).then((response) => {
      ({ id_token, access_token } = response.data);
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('idToken', id_token);

      // remove code from url
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.delete('code');
      const newUrl = `${window.location.origin}${window.location.pathname}?${urlParams.toString()}`;
      window.history.replaceState(null, '', newUrl);

    }).catch((error) => {
        console.error('Error exchanging code for token:', error);
    });
  }

  if (id_token) {
    const decodedToken = decodeJwt(id_token);
    const userEmail = decodedToken.email;

    document.getElementById('user-logged').textContent = `You are logged in as:`;
    document.getElementById('user-email').textContent = userEmail;

    // console.log('Logged in successfully! - ' + access_token);
  }
}
window.cognitoOnLoad = cognitoOnLoad;

const logOffButton = document.getElementById('logOff');
logOffButton.addEventListener('click', () => {
    window.location.href = `${domain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(redirectUri)}`;
    localStorage.removeItem('accessToken');
    document.getElementById('user-logged').textContent = `You are not logged in`;
    document.getElementById('user-email').textContent = ``;
});
