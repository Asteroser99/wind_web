const clientId    = '760tl57va0f4esqlrn9kdprdqe';
const domain      = 'https://eu-central-1jasxje83x.auth.eu-central-1.amazoncognito.com';
const scope       = "email+openid+phone";

const redirectUri = 'https://winding.surge.sh/';

const poolData = {
    UserPoolId: 'eu-central-1_jaSxje83x',
    ClientId: '760tl57va0f4esqlrn9kdprdqe',
  };
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

function toggleLogin(toggled){
  cognitoStatus();

  const signContainer = document.getElementById("signContainer");
  signContainer.style.display = !toggled ? "none" : "flex";
  if (toggled)
      document.getElementById("signCloseButton").classList.add('active');
  else 
      document.getElementById("loginToggle").classList.remove('active');
}
window.toggleLogin = toggleLogin


// function login(username, password) {
//     console.log("login");
//     const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
//         Username: username,
//         Password: password,
//     });

//     const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
//         Username: username,
//         Pool: userPool,
//     });

//     cognitoUser.authenticateUser(authenticationDetails, {
//         onSuccess: (result) => {
//             console.log('Access token:', result.getAccessToken().getJwtToken());
//             // Сохраните токен для будущих запросов
//             localStorage.setItem('accessToken', result.getAccessToken().getJwtToken());
//         },
//         onFailure: (err) => {
//             console.error(err);
//         },
//     });
// }

function cognitoLogIn() {
    window.location.href = `${domain}/login?client_id=${clientId}&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}`;
};
window.cognitoLogIn = cognitoLogIn

function cognitoLogOff() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('idToken');
  localStorage.removeItem('refreshToken')

  window.location.href = `${domain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(redirectUri)}`;
}
window.cognitoLogOff = cognitoLogOff;



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

function cognitoTime(time) {
    return new Date(time * 1000);
}
  
function cognitoCodeExchange(){
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  // console.log(code);

  if (code) {
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
      const { id_token, access_token } = response.data;

      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('idToken', id_token);

      cognitoStatus();

      const decodedToken = decodeJwt(id_token);
      let delay = cognitoTime(decodedToken.exp) - Date.now();
      console.log(delay)
      setTimeout(cognitoExpire, delay);

      // remove code from url
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.delete('code');
      const strUrlParams = urlParams.toString();
      if (strUrlParams.length > 0) strUrlParams = "?" + strUrlParams;

      const newUrl = `${window.location.origin}${window.location.pathname}${strUrlParams}`;
      window.history.replaceState(null, '', newUrl);

    }).catch((error) => {
        console.error('Error exchanging code for token:', error);
    });
  }
}

function cognitoExpire() {
    showError("Session expired. Please log in again.");

    // localStorage.removeItem('accessToken');
    // localStorage.removeItem('idToken');

    cognitoStatus();
}

function cognitoStatus() {
    let access_token = localStorage.getItem('accessToken');
    let id_token = localStorage.getItem('idToken');
    let decodedToken = null;

    // console.log("cognitoStatus", id_token);

    let logged = false;
    if (id_token) {
        decodedToken = decodeJwt(id_token);
        // console.log(decodedToken);
        logged = Date.now() <= cognitoTime(decodedToken.exp);
    }

  changeImage("logImg", logged ? "logIn.png" : "logOff.png");

  if (logged) {
    document.getElementById("loggedInContainer" ).style.display = "flex";
    document.getElementById("loggedOffContainer").style.display = "none";

    document.getElementById('user-email'  ).textContent = decodedToken.email;
    document.getElementById('user-expires').textContent = "Session expires: " + cognitoTime(decodedToken.exp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    document.getElementById("loggedInContainer" ).style.display = "none";
    document.getElementById("loggedOffContainer").style.display = "flex";
  }
}


function cognitoOnLoad() {
  cognitoCodeExchange();

  cognitoStatus();
  setInterval(cognitoStatus, 10 * 60 * 1000);
}
window.cognitoOnLoad = cognitoOnLoad;
