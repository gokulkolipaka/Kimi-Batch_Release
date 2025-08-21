/* ========== CONFIG ========== */
const DB_KEY = "batchReleaseDB";
const DEFAULT_ADMIN = {email:"admin@demo.com",password:"Admin123!",role:"admin",name:"System Admin"};
const PASS_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const REQUIRED_DOCS = ["BMR","COA","LOD","Deviation","Equipment","Labeling","QA_review"];

/* ========== INIT ========== */
let DB = JSON.parse(localStorage.getItem(DB_KEY)) || {users:[DEFAULT_ADMIN],batches:[],audit:[]};
function save(){localStorage.setItem(DB_KEY,JSON.stringify(DB));}

/* ========== AUTH ========== */
function showLogin(){["loginForm","signupForm","forgotForm"].forEach(id=>hide(id));show("loginForm")}
function showSignup(){["loginForm","signupForm","forgotForm"].forEach(id=>hide(id));show("signupForm")}
function showForgot(){["loginForm","signupForm","forgotForm"].forEach(id=>hide(id));show("forgotForm")}
function login(){
  const email = val("loginEmail"), pw=val("loginPw");
  const user = DB.users.find(u=>u.email===email && u.password===pw);
  if(!user){alert("Invalid credentials");return;}
  if(user.role==="admin"){show("adminDash");renderUsers();renderBatches();}else{show("userDash");}
  audit("login",email);
}
function register(){
  const name=val("regName"),email=val("regEmail"),pw=val("regPw");
  if(!PASS_REGEX.test(pw)){alert("Weak password");return;}
  if(DB.users.find(u=>u.email===email)){alert("Email exists");return;}
  DB.users.push({name,email,password:pw,role:"user"});
  save();audit("register",email);alert("Registered! Please login.");showLogin();
}
function sendReset(){
  const email=val("forgotEmail");
  const user=DB.users.find(u=>u.email===email);
  if(!user){alert("Email not found");return;}
  const link=`mailto:${email}?subject=Reset Password&body=Use this temporary token: ${Math.random().toString(36).slice(-8)}`;
  window.location.href=link;
}
function logout(){
  ["adminDash","userDash"].forEach(hide);showLogin();
}

/* ========== ADMIN ========== */
function renderUsers(){
  const tbl=document.getElementById("userTable");
  tbl.innerHTML="<tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr>";
  DB.users.forEach((u,i)=>{
    tbl.insertAdjacentHTML("beforeend",
      `<tr>
        <td>${u.name}</td><td>${u.email}</td><td>${u.role}</td>
        <td><button onclick="delUser(${i})">Delete</button></td>
      </tr>`);
  });
}
function addUser(){
  const email=prompt("Email"),name=prompt("Name"),pw=prompt("Password");
  if(!email||!pw||!name)return;
  if(!PASS_REGEX.test(pw)){alert("Weak");return;}
  if(DB.users.find(u=>u.email===email)){alert("Exists");return;}
  DB.users.push({name,email,password:pw,role:"user"});
  save();renderUsers();
}
function delUser(idx){
  if(DB.users[idx].role==="admin")return alert("Cannot delete admin");
  DB.users.splice(idx,1);save();renderUsers();
}
function renderBatches(){
  const div=document.getElementById("batchList");
  div.innerHTML="";
  DB.batches.forEach((b,i)=>div.insertAdjacentHTML("beforeend",
    `<div class="card">
      <p>Batch: ${b.name}</p>
      <button onclick="approve(${i},true)">Approve</button>
      <button onclick="approve(${i},false)">Reject</button>
    </div>`));
}
function approve(idx,decision){
  const b=DB.batches[idx];
  b.status=decision?"Approved":"Rejected";
  b.approvedBy=currentUser();b.date=now();
  save();renderBatches();audit("approve",b.name);
}

/* ========== USER ========== */
function uploadDocs(){
  const files=document.getElementById("docUpload").files;
  if(!files.length){alert("Select files");return;}
  const missing=REQUIRED_DOCS.slice();
  for(let f of files){
    const type=prompt(`Document type for ${f.name}`,missing[0]);
    if(type){missing.splice(missing.indexOf(type),1);}
  }
  const na=prompt("Any N/A? (comma separated)").split(",").map(x=>x.trim());
  na.forEach(x=>missing.splice(missing.indexOf(x),1));
  document.getElementById("gapReport").innerHTML=missing.length?`<h3>Missing/NA:</h3><ul>${missing.map(m=>`<li>${m}</li>`).join("")}</ul>`:"<h3>All documents present ✓</h3>";
  DB.batches.push({name:prompt("Batch name?"),files:[...files].map(f=>f.name),status:"Pending"});
  save();audit("upload",name);
}

/* ========== UTILS ========== */
function val(id){return document.getElementById(id).value;}
function show(id){document.getElementById(id).classList.remove("hidden")}
function hide(id){document.getElementById(id).classList.add("hidden")}
function now(){return new Date().toISOString();}
function currentUser(){return DB.users[0].email;} // simplified
function audit(action,desc){
  DB.audit.push({user:currentUser(),action,desc,time:now()});
  save();
}

/* ========== THEME ========== */
document.getElementById("themeToggle").onclick=()=>{
  const html=document.documentElement;
  html.dataset.theme=html.dataset.theme==="dark"?"light":"dark";
}

/* ========== ON LOAD ========== */
showLogin();