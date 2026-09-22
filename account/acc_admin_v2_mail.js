/* =========================================================
   慢慢｜共付日常 acc_admin_v2_mail.js
   - 一般使用者 Email 申請雲端帳本入口
   - 申請送件已串接 submit_cloud_application
   - Email 驗證頁已接好前端流程，等待後端 verify / complete 動作
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
  const verifyPasswordForm=document.querySelector("#cloudBookVerifyPasswordForm");
  const verifyPassword=document.querySelector("#cloudBookVerifyPassword");
  const verifyPasswordConfirm=document.querySelector("#cloudBookVerifyPasswordConfirm");
  const verifyPasswordMessage=document.querySelector("#cloudBookVerifyPasswordMessage");
  const verifyComplete=document.querySelector("#cloudBookVerifyComplete");

  if(!applyBtn||!panel||!form||!email||!backBtn||!message)return;

  function resetApplyForm(){
    form.reset();
    message.textContent="";
  }

  function showApply(){
    resetApplyForm();
    window.AccAdminV2?.showManagePanel?.("cloud-apply");
    setTimeout(()=>email.focus(),0);
  }

  function back(){
    resetApplyForm();
    window.AccAdminV2?.showManagePanel?.("menu");
  }

  async function showVerifyState(state){
    if(!verifyPanel)return;

    // acc_admin_v2.js 與本檔都在 DOMContentLoaded 啟動。
    // 主檔為 async callback，showManagePanel 可能尚未掛到 AccAdminV2；
    // 驗證連結進站時等待它就緒，避免驗證 UI 被安靜略過。
    for(let i=0;i<50&&!window.AccAdminV2?.showManagePanel;i++){
      await new Promise(resolve=>setTimeout(resolve,20));
    }
    document.querySelector("#manageBookModal")?.classList.remove("hidden");
    window.AccAdminV2?.showManagePanel?.("cloud-verify");

    if(verifyChecking)verifyChecking.hidden=state!=="checking";
    if(verifySuccess)verifySuccess.hidden=state!=="success";
    if(verifyFailed)verifyFailed.hidden=state!=="failed";
  }

  const params=new URLSearchParams(location.search);
  const verifyToken=params.get("verify");

  async function invokeMailAction(action,payload={}){
    const supabase=window.AccAdminV2?.supabase;
    if(!supabase)throw new Error("cloud unavailable");
    const {data,error}=await supabase.functions.invoke("acc-admin-mail-v1-2026",{
      body:{action,payload}
    });
    if(error)throw error;
    if(data?.error)throw new Error(data.error);
    return data;
  }

  async function checkVerifyToken(){
    if(!verifyToken)return;
    await showVerifyState("checking");
    try{
      await invokeMailAction("verify",{token:verifyToken});
      await showVerifyState("success");
      setTimeout(()=>verifyPassword?.focus(),0);
    }catch(error){
      console.error("verify cloud application failed",error);
      await showVerifyState("failed");
    }
  }

  if(verifyToken)checkVerifyToken();

  verifyPasswordForm?.addEventListener("submit",async event=>{
    event.preventDefault();
    const first=verifyPassword?.value||"";
    const second=verifyPasswordConfirm?.value||"";
    const submitBtn=verifyPasswordForm.querySelector('button[type="submit"]');

    if(verifyPasswordMessage)verifyPasswordMessage.textContent="";
    if(!first){
      if(verifyPasswordMessage)verifyPasswordMessage.textContent="請輸入管理密碼";
      verifyPassword?.focus();
      return;
    }
    if(first!==second){
      if(verifyPasswordMessage)verifyPasswordMessage.textContent="兩次輸入的管理密碼不一致";
      verifyPasswordConfirm?.focus();
      return;
    }
    if(!verifyToken){
      showVerifyState("failed");
      return;
    }

    if(submitBtn)submitBtn.disabled=true;
    if(verifyPasswordMessage)verifyPasswordMessage.textContent="正在建立管理帳號";
    try{
      const data=await invokeMailAction("complete",{
        token:verifyToken,
        password:first
      });
      if(data?.session?.access_token&&data?.session?.refresh_token){
        const adminSupabase=window.AccAdminV2?.adminSupabase;
        if(adminSupabase){
          const {error}=await adminSupabase.auth.setSession({
            access_token:data.session.access_token,
            refresh_token:data.session.refresh_token
          });
          if(error)throw error;
        }
      }
      verifyPasswordForm.hidden=true;
      if(verifyComplete)verifyComplete.hidden=false;
      if(verifyPasswordMessage)verifyPasswordMessage.textContent="";
      history.replaceState(null,"",location.pathname+location.hash);
    }catch(error){
      console.error("complete cloud application failed",error);
      if(verifyPasswordMessage)verifyPasswordMessage.textContent="管理帳號建立失敗";
    }finally{
      if(submitBtn)submitBtn.disabled=false;
    }
  });

  if(verifyManageBtn){
    verifyManageBtn.addEventListener("click",async()=>{
      await window.AccAdminV2?.enterManagementMode?.();
    });
  }

  applyBtn.addEventListener("click",showApply);
  backBtn.addEventListener("click",back);

  form.addEventListener("submit",async event=>{
    event.preventDefault();
    const value=email.value.trim();
    const who=relation?.value.trim()||"";
    const supabase=window.AccAdminV2?.supabase;

    if(!value){
      message.textContent="請輸入 Email";
      email.focus();
      return;
    }
    if(!who){
      message.innerHTML="你沒說你<del>他媽</del>誰";
      relation?.focus();
      return;
    }
    if(!supabase){
      message.textContent="雲端服務尚未初始化";
      return;
    }

    const submitBtn=form.querySelector('button[type="submit"]');
    if(submitBtn)submitBtn.disabled=true;
    message.textContent="正在送出申請";

    try{
      const {error}=await supabase.rpc("submit_cloud_application",{
        p_email:value,
        p_who_are_you:who
      });
      if(error)throw error;

      form.reset();
      message.textContent="申請已送出";
    }catch(error){
      console.error("submit cloud application failed",error);
      const text=String(error?.message||"");
      message.textContent=text.includes("application already active")
        ?"這個 Email 已經有申請了"
        :"申請送出失敗";
    }finally{
      if(submitBtn)submitBtn.disabled=false;
    }
  });
});
