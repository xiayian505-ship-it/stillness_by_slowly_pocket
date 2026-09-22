/* =========================================================
   慢慢｜共付日常 acc_admin_v2_mail.js
   - 一般使用者 Email 申請雲端帳本入口
   - 目前只完成前端申請畫面
   - 尚未串接送件、人工審核與驗證信
========================================================= */
document.addEventListener("DOMContentLoaded",()=>{
  "use strict";

  const applyBtn=document.querySelector("#applyCloudBookBtn");
  const panel=document.querySelector("#cloudBookApplyPanel");
  const form=document.querySelector("#cloudBookApplyForm");
  const email=document.querySelector("#cloudBookApplyEmail");
  const relation=document.querySelector("#cloudBookApplyRelation");
  const backBtn=document.querySelector("#cloudBookApplyBackBtn");
  const message=document.querySelector("#cloudBookApplyMessage");
  const verifyPanel=document.querySelector("#cloudBookVerifyPanel");
  const verifyChecking=document.querySelector("#cloudBookVerifyChecking");
  const verifySuccess=document.querySelector("#cloudBookVerifySuccess");
  const verifyFailed=document.querySelector("#cloudBookVerifyFailed");
  const verifyManageBtn=document.querySelector("#cloudBookVerifyManageBtn");

  if(!applyBtn||!panel||!form||!email||!backBtn||!message)return;

  function showApply(){
    message.textContent="";
    window.AccAdminV2?.showManagePanel?.("cloud-apply");
    setTimeout(()=>email.focus(),0);
  }

  function back(){
    message.textContent="";
    window.AccAdminV2?.showManagePanel?.("menu");
  }

  function showVerifyState(state){
    if(!verifyPanel)return;
    window.AccAdminV2?.showManagePanel?.("cloud-verify");
    if(verifyChecking)verifyChecking.hidden=state!=="checking";
    if(verifySuccess)verifySuccess.hidden=state!=="success";
    if(verifyFailed)verifyFailed.hidden=state!=="failed";
  }

  const params=new URLSearchParams(location.search);
  const verifyToken=params.get("verify");
  if(verifyToken){
    // 前端殼：目前只顯示確認中，不把 token 當成已驗證成功
    showVerifyState("checking");
  }

  if(verifyManageBtn){
    verifyManageBtn.addEventListener("click",()=>{
      // 後端接好後，成功狀態再導向一般使用者的雲端帳本管理
      window.AccAdminV2?.showManagePanel?.("menu");
    });
  }

  applyBtn.addEventListener("click",showApply);
  backBtn.addEventListener("click",back);

  form.addEventListener("submit",event=>{
    event.preventDefault();
    const value=email.value.trim();
    if(!value){
      message.textContent="請輸入 Email";
      email.focus();
      return;
    }
    if(!relation?.value.trim()){
      message.innerHTML="你沒說你<del>他媽</del>誰";
      relation?.focus();
      return;
    }
    message.textContent="申請功能尚未開放";
  });
});
