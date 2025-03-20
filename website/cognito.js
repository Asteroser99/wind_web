const clientId    = '760tl57va0f4esqlrn9kdprdqe';
const domain      = 'https://eu-central-1jasxje83x.auth.eu-central-1.amazoncognito.com';
const scope       = "email+openid+phone";

const redirectUri = 'https://winding.surge.sh/';

const poolData = {
    UserPoolId: 'eu-central-1_jaSxje83x',
    ClientId: '760tl57va0f4esqlrn9kdprdqe',
  };
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);


function localSet(id, value){
    localStorage.setItem(id, JSON.stringify(value));
}

function localGet(id){
    return JSON.parse(localStorage.getItem(id));
}
window.localGet = localGet

function localClear(id){
    localStorage.removeItem(id);
}


function toggleLogin(toggled){
  cognitoStatus();

  const loginContainer = document.getElementById("loginContainer");
  loginContainer.style.display = !toggled ? "none" : "flex";
  if (toggled)
      document.getElementById("loginCloseButton").classList.add('active');
  else 
      document.getElementById("loginToggle").classList.remove('active');
}
window.toggleLogin = toggleLogin


function cognitoLogIn() {
    window.location.href = `${domain}/login?client_id=${clientId}&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}`;
};
window.cognitoLogIn = cognitoLogIn

function cognitoLogOff() {
  localClear('accessToken');
  localClear('idToken');
  localClear('refreshToken')

  window.location.href = `${domain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(redirectUri)}`;
}
window.cognitoLogOff = cognitoLogOff;


function decodeJwt(token) {
    if (!token) return undefined;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join('')
    );
    const res = JSON.parse(jsonPayload);
    return res;
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
      const idToken = decodeJwt(response.data.id_token);
      localSet('idToken', idToken);

      const access_token = response.data.access_token;
      localSet('accessToken', access_token);

      cognitoStatus();

      let delay = cognitoTime(idToken.exp) - Date.now();
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

    // localClear('accessToken');
    // localClear('idToken');

    cognitoStatus();
}

function cognitoStatus() {
    let idToken = localGet('idToken');

    let logged = false;
    if (idToken) {
      logged = Date.now() <= cognitoTime(idToken.exp);
    }

  changeImage("logImg", logged ? "logIn.png" : "logOff.png");

  if (logged) {
    document.getElementById("loggedInContainer" ).style.display = "flex";
    document.getElementById("loggedOffContainer").style.display = "none";
    document.getElementById('user-email'  ).textContent = idToken.email;
    document.getElementById('user-expires').textContent = "Session expires at " + cognitoTime(idToken.exp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    document.getElementById("loggedInContainer" ).style.display = "none";
    document.getElementById("loggedOffContainer").style.display = "flex";
  }
}

function stripeSubscribe(){
  const idToken = localGet('idToken');

  loading();
  lambdaCall("payment/subscribe", [idToken.email])
      .then(res => {
          loaded();
          if (res)
            window.location.href = res;
      })
      .catch(error => {
          showError(error);
      });
}
window.stripeSubscribe = stripeSubscribe

function stripeUnSubscribe(){
  loading();
  lambdaCall("payment/unSubscribe", [])
      .then(res => {
          loaded();
      })
      .catch(error => {
          showError(error);
      });
}
window.stripeUnSubscribe = stripeUnSubscribe


function cognitoOnLoad() {
  cognitoCodeExchange();
  cognitoStatus();
}
window.cognitoOnLoad = cognitoOnLoad;
