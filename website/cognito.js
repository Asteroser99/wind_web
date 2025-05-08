const clientId    = '760tl57va0f4esqlrn9kdprdqe';
const domain      = 'https://eu-central-1jasxje83x.auth.eu-central-1.amazoncognito.com';
const scope       = "email+openid"; // +phone

const originURL = window.location.origin + '/';

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


function toggleLogin(toggled, param){
  cognitoStatus();

  const loginContainer = document.getElementById("loginContainer");
  loginContainer.style.display = !toggled ? "none" : "flex";
  if (toggled)
      document.getElementById("loginCloseButton").classList.add('active');
  else
      document.getElementById("loginToggle").classList.remove('active');
}
window.toggleLogin = toggleLogin

function showImpressumContainer(){
  const container = document.getElementById("impressumContainer");
  const toggled = true;
  container.style.display = !toggled ? "none" : "flex";
}

function showImpressum(param){
  loadContent(param, "impressum-text", showImpressumContainer);
}
window.showImpressum = showImpressum

function hideImpressum(param){
  const container = document.getElementById("impressumContainer");
  const toggled = false;
  container.style.display = !toggled ? "none" : "flex";
  // document.getElementById("impressumToggle").classList.remove('active');
}
window.hideImpressum = hideImpressum


function cognitoLogIn() {
    window.location.href = `${domain}/login?client_id=${clientId}&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(originURL)}`;
};
window.cognitoLogIn = cognitoLogIn

function cognitoLogOff() {
  cognitoClear();

  window.location.href = `${domain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(originURL)}`;
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

function timeNow() {
  return new Date(Date.now());
}

function cognitoClear() {
  localClear('cognitoEMail');
  localClear('cognitoAccessToken');
  localClear('cognitoAuthTime');
  localClear('cognitoExpires');
}

function cognitoCodeExchange(){
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  // console.log(code);

  if (code) {
    axios.post(`${domain}/oauth2/token`, new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: originURL,
      code: code,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }).then((response) => {
      const cognitoIdToken = decodeJwt(response.data.id_token);
      localSet('cognitoEMail', cognitoIdToken.email);

      const cognitoAccessToken = response.data.access_token;
      localSet('cognitoAccessToken', cognitoAccessToken);

      const cognitoAccessTokenDecoded  = decodeJwt(cognitoAccessToken);
      const cognitoAuthTime = cognitoAccessTokenDecoded.auth_time
      localSet('cognitoAuthTime', cognitoAuthTime);
      const cognitoExpires = cognitoAccessTokenDecoded.exp
      localSet('cognitoExpires', cognitoExpires);

      cognitoStatus();

      let delay = cognitoTime(cognitoExpires) - Date.now();
      setTimeout(cognitoExpire, delay);

      stripeStatus();

    }).catch((error) => {
        console.error('Error exchanging code for token:', error);
    
    }).finally(() => {
      // remove code from url
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.delete('code');
      const strUrlParams = urlParams.toString();
      if (strUrlParams.length > 0) strUrlParams = "?" + strUrlParams;

      const newUrl = `${window.location.origin}${window.location.pathname}${strUrlParams}`;
      window.history.replaceState(null, '', newUrl);
    });
  }
}

function cognitoExpire() {
    showError("Session expired. Please sign in again.");

    // cognitoClear()

    cognitoStatus();
}

function cognitoLogged() {
  let logged = false;

  const cognitoAccessTokenExpires = localGet('cognitoExpires');
  if (cognitoAccessTokenExpires) {
    logged = timeNow() <= cognitoTime(cognitoAccessTokenExpires);
  }

  return logged;
}

function cognitoStatus() {
  const logged = cognitoLogged()

  changeImage("logImg", logged ? "logIn.png" : "logOff.png");

  if (logged) {
    document.getElementById("loggedInContainer" ).style.display = "flex";
    document.getElementById("loggedOffContainer").style.display = "none";
    
    document.getElementById('cognitoEMail'   ).textContent = localGet('cognitoEMail');
    document.getElementById('cognitoAuthTime').textContent = cognitoTime(localGet('cognitoAuthTime')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('cognitoExpires' ).textContent = cognitoTime(localGet('cognitoExpires')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    document.getElementById("loggedInContainer" ).style.display = "none";
    document.getElementById("loggedOffContainer").style.display = "flex";
  }
}


// Stripe

function formatDate(dateStr) {
  let date    = new Date(dateStr);
  let day     = String(date.getDate()).padStart(2, "0");
  let month   = String(date.getMonth() + 1).padStart(2, "0");
  let year    = String(date.getFullYear()).slice(-2);
  let hours   = String(date.getHours()).padStart(2, "0");
  let minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

function stripeStatus(){
  if (!cognitoLogged()) return

  lambdaCall("payment.status", [])
      .then(res => {
          const res_ = !!res;

          document.getElementById("SubscriptionExist"   ).style.display =  res_ ? "flex" : "none";
          document.getElementById("SubscriptionNotExist").style.display = !res_ ? "flex" : "none";

          if (res_ && false){ // betaversion
            document.getElementById('subscriptionDescription').innerHTML = `
              <table>
                <tr><td>Status:</td><td><div class="hPanel"><img class="icon-img small" src="./img/subscribe.png">&nbsp;Active</div></td></tr>
                <tr><td>Started:</td><td>${formatDate(cognitoTime(res.start))}</td></tr>
                <tr><td>Expires:</td><td>${formatDate(cognitoTime(res.end))}</td></tr>
                <tr><td>Call count:</td><td>${res.callCount != undefined ? res.callCount : 0}</td></tr>
                <tr><td>Auto-renew:</td>
                  <td>
                    <div class="hPanel">
                      <img class="icon-img small" src="./img/${res.cancel_at_period_end ? "reNewOff" : "reNewOn"}.png">
                      ${res.cancel_at_period_end ? "Off" : "On"}
                    </div>
                  </td>
                </tr>
              </table>
            `;
            document.getElementById("reNewOn" ).style.display = !res.cancel_at_period_end ? "flex" : "none";
            document.getElementById("reNewOff").style.display =  res.cancel_at_period_end ? "flex" : "none";
          }

          stripeRenewDisabled(false);
        })
      .catch(error => {
          showError(error);
      });
}

function stripeSubscribe(){
  loading();
  lambdaCall("payment.subscribe", [localGet('cognitoEMail')])
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

function stripeRenewDisabled(disabled){
  document.querySelectorAll('button.stripe-renew').forEach(btn => {
    btn.disabled = disabled;
  });
}

function stripeRenew(param){
  loading();
  stripeRenewDisabled(true);
  lambdaCall("payment.renew", [param == "On"])
      .then(res => {
          loaded();
          setTimeout(stripeStatus, 5000);
        })
      .catch(error => {
          showError(error);
      });
}
window.stripeRenew = stripeRenew


function cognitoOnLoad() {
  cognitoCodeExchange();
  cognitoStatus();
  stripeStatus();
}
window.cognitoOnLoad = cognitoOnLoad;
