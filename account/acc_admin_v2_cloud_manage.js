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
  const applicationsBtn=document.querySelector("#viewCloudApplicationsBtn");
  const managePanel=document.querySelector("#manageCloudBooksPanel");
  const createPanel=document.querySelector("#createCloudBookPanel");
  const applicationsPanel=document.querySelector("#cloudApplicationsPanel");
  const applicationsList=document.querySelector("#cloudApplicationsList");
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
    const managing=mode==="manage";
    const creating=mode==="create";
    const applications=mode==="applications";
    managePanel.hidden=!managing;
    createPanel.hidden=!creating;
    if(applicationsPanel)applicationsPanel.hidden=!applications;
    manageBtn.classList.toggle("is-active",managing);
    createBtn.classList.toggle("is-active",creating);
    applicationsBtn?.classList.toggle("is-active",applications);
    manageBtn.setAttribute("aria-pressed",String(managing));
    createBtn.setAttribute("aria-pressed",String(creating));
    applicationsBtn?.setAttribute("aria-pressed",String(applications));
    if(creating)setTimeout(()=>password?.focus(),0);
  }

  function escapeHtml(value){
    return String(value??"")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function applicationStatusLabel(status){
    if(status==="approved")return "已通過";
    if(status==="rejected")return "未通過";
    return "待審核";
  }

  async function sendVerificationEmail(applicationId){
    const supabase=window.AccAdminV2?.adminSupabase;
    if(!supabase)throw new Error("admin cloud unavailable");
    const {data:{session},error:sessionError}=await supabase.auth.getSession();
    if(sessionError)throw sessionError;
    if(!session?.access_token)throw new Error("admin session unavailable");

    const response=await fetch("https://bkjqaetxwvcdciieevvs.supabase.co/functions/v1/acc-admin-mail-v1-2026",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":`Bearer ${session.access_token}`,
        "apikey":"sb_publishable_dAHoIimWgbGAF2wtIVSZfg_V8rzc200"
      },
      body:JSON.stringify({
        action:"send",
        template:"cloud_book_email_verification",
        payload:{applicationId}
      })
    });
    const result=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(result?.error||`mail function ${response.status}`);
    return result;
  }

  async function loadApplications(){
    if(!applicationsList)return;
    const supabase=window.AccAdminV2?.adminSupabase;
    if(!supabase){
      applicationsList.innerHTML='<div class="access-message">雲端服務尚未初始化</div>';
      return;
    }

    applicationsList.innerHTML='<div class="access-message">正在讀取申請</div>';

    try{
      const {data,error}=await supabase.rpc("list_cloud_applications");
      if(error)throw error;

      const rows=Array.isArray(data)?data:[];
      if(!rows.length){
        applicationsList.innerHTML='<div class="access-message">目前沒有帳本申請</div>';
        return;
      }

      applicationsList.innerHTML=rows.map(row=>{
        const pending=row.status==="pending";
        return `
          <div class="share-box cloud-application-item" data-application-id="${escapeHtml(row.id)}">
            <div class="ledger-label">${applicationStatusLabel(row.status)}</div>
            <p>${escapeHtml(row.email)}</p>
            <div class="ledger-label">你誰</div>
            <p>${escapeHtml(row.who_are_you)}</p>
            ${pending?`
              <div class="access-actions">
                <button type="button" data-application-decision="rejected">不通過</button>
                <button type="button" class="btn-confirm" data-application-decision="approved">通過</button>
              </div>
            `:""}
            <div class="access-message" data-application-message></div>
          </div>
        `;
      }).join("");
    }catch(error){
      console.error("load cloud applications failed",error);
      applicationsList.innerHTML='<div class="access-message">帳本申請讀取失敗</div>';
    }
  }

  applicationsList?.addEventListener("click",async event=>{
    const button=event.target.closest("[data-application-decision]");
    if(!button)return;

    const item=button.closest("[data-application-id]");
    const applicationId=item?.dataset.applicationId||"";
    const decision=button.dataset.applicationDecision||"";
    const message=item?.querySelector("[data-application-message]");
    const supabase=window.AccAdminV2?.adminSupabase;

    if(!applicationId||!supabase)return;

    item.querySelectorAll("[data-application-decision]").forEach(btn=>btn.disabled=true);
    if(message)message.textContent=decision==="approved"?"正在通過申請":"正在設為不通過";

    try{
      const {error}=await supabase.rpc("review_cloud_application",{
        p_application_id:applicationId,
        p_decision:decision
      });
      if(error)throw error;

      if(decision==="approved"){
        if(message)message.textContent="申請已通過 正在寄驗證信";
        await sendVerificationEmail(applicationId);
        if(message)message.textContent="申請已通過 驗證信已寄出";
      }

      await loadApplications();
    }catch(error){
      console.error("review cloud application failed",error);
      if(message)message.textContent="審核失敗";
      item.querySelectorAll("[data-application-decision]").forEach(btn=>btn.disabled=false);
    }
  });

  manageBtn.addEventListener("click",()=>show("manage"));
  createBtn.addEventListener("click",()=>{resetCreateForm();show("create");});
  applicationsBtn?.addEventListener("click",()=>{show("applications");loadApplications();});
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
