/* =========================================================
   慢慢｜共付日常 acc_admin_v2_cloud_manage.js
   - 雲端帳本管理入口 UI 專用
   - 管理既有帳本／建立新帳本的畫面切換
   - 建立新帳本時呼叫 create_cloud_book RPC
========================================================= */
document.addEventListener("DOMContentLoaded",()=>{
  "use strict";

  const manageBtn=document.querySelector("#manageCloudBooksBtn");
  const createBtn=document.querySelector("#createCloudBookBtn");
  const managePanel=document.querySelector("#manageCloudBooksPanel");
  const createPanel=document.querySelector("#createCloudBookPanel");
  const password=document.querySelector("#createCloudBookPassword");
  const confirm=document.querySelector("#createCloudBookPasswordConfirm");
  const cancelBtn=document.querySelector("#createCloudBookCancelBtn");
  const submitBtn=document.querySelector("#createCloudBookConfirmBtn");
  const status=document.querySelector("#createCloudBookStatus");
  const result=document.querySelector("#createCloudBookResult");
  const resultUrl=document.querySelector("#createCloudBookUrl");
  const copyBtn=document.querySelector("#copyCreatedCloudBookUrlBtn");

  if(!manageBtn||!createBtn||!managePanel||!createPanel)return;

  function resetCreateForm(){
    if(password)password.value="";
    if(confirm)confirm.value="";
    if(status)status.textContent="";
    if(result)result.hidden=true;
    if(resultUrl)resultUrl.textContent="";
    if(copyBtn)copyBtn.dataset.url="";
  }

  function show(mode){
    const creating=mode==="create";
    managePanel.hidden=creating;
    createPanel.hidden=!creating;
    manageBtn.classList.toggle("is-active",!creating);
    createBtn.classList.toggle("is-active",creating);
    manageBtn.setAttribute("aria-pressed",String(!creating));
    createBtn.setAttribute("aria-pressed",String(creating));
    if(creating)setTimeout(()=>password?.focus(),0);
  }

  manageBtn.addEventListener("click",()=>show("manage"));
  createBtn.addEventListener("click",()=>{resetCreateForm();show("create");});
  cancelBtn?.addEventListener("click",()=>{resetCreateForm();show("manage");});

  submitBtn?.addEventListener("click",async()=>{
    if(status)status.textContent="";
    const first=password?.value||"";
    const second=confirm?.value||"";
    const supabase=window.AccAdminV2?.adminSupabase;

    if(!first){if(status)status.textContent="請輸入共享密碼。";password?.focus();return;}
    if(first!==second){if(status)status.textContent="兩次輸入的共享密碼不一致。";confirm?.focus();return;}
    if(!supabase){if(status)status.textContent="雲端服務尚未初始化，請重新整理後再試。";return;}

    submitBtn.disabled=true;
    if(cancelBtn)cancelBtn.disabled=true;
    if(status)status.textContent="正在建立雲端帳本……";
    if(result)result.hidden=true;

    try{
      const {data,error}=await supabase.rpc("create_cloud_book",{p_password:first});
      if(error)throw error;

      const bookId=typeof data==="string"?data:"";
      if(!bookId)throw new Error("create_cloud_book did not return book id");

      const shareUrl=new URL(location.href);
      shareUrl.search="";
      shareUrl.searchParams.set("book",bookId);
      const url=shareUrl.toString();

      if(password)password.value="";
      if(confirm)confirm.value="";
      if(resultUrl)resultUrl.textContent=url;
      if(copyBtn)copyBtn.dataset.url=url;
      if(result)result.hidden=false;
      if(status)status.textContent="雲端帳本已建立。";

      await window.AccAdminV2?.loadAdminBooks?.();
    }catch(error){
      console.error("create cloud book failed",error);
      if(status){
        status.textContent=String(error?.message||"").includes("cloud book limit reached")
          ?"已達雲端帳本上限。"
          :"雲端帳本建立失敗，請稍後再試。";
      }
    }finally{
      submitBtn.disabled=false;
      if(cancelBtn)cancelBtn.disabled=false;
    }
  });

  copyBtn?.addEventListener("click",async()=>{
    const url=copyBtn.dataset.url||"";
    if(!url)return;
    try{await navigator.clipboard.writeText(url);if(status)status.textContent="共享帳本網址已複製。";}
    catch(error){console.error("copy created cloud book url failed",error);if(status)status.textContent="網址複製失敗，請手動複製。";}
  });

  show("manage");
});
