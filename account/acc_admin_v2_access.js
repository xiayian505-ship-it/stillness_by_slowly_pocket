/* =========================================================
   慢慢｜共付日常 acc_admin_v2_access.js
   - 雲端帳本「存取管理」專用
   - 管理模式設定／重設共享密碼
   - 不碰帳本 state、唯讀分享與日常記帳功能
========================================================= */
document.addEventListener("DOMContentLoaded",()=>{
  "use strict";

  const bookSelect=document.querySelector("#adminBookSelect");
  const panel=document.querySelector("#adminAccessTools");
  const password=document.querySelector("#adminSharedPassword");
  const confirm=document.querySelector("#adminSharedPasswordConfirm");
  const cancelButton=document.querySelector("#adminSharedPasswordCancelBtn");
  const confirmButton=document.querySelector("#adminSharedPasswordConfirmBtn");
  const status=document.querySelector("#adminAccessStatus");

  if(!bookSelect||!panel||!password||!confirm||!cancelButton||!confirmButton||!status)return;

  function resetFields({keepStatus=false}={}){
    password.value="";
    confirm.value="";
    if(!keepStatus)status.textContent="";
  }

  function syncSelectedBook(){
    const hasBook=Boolean(bookSelect.value);
    panel.hidden=!hasBook;
    resetFields();
  }

  bookSelect.addEventListener("change",syncSelectedBook);

  cancelButton.addEventListener("click",()=>{
    resetFields();
    password.focus();
  });

  confirmButton.addEventListener("click",async()=>{
    const bookId=bookSelect.value;
    const nextPassword=password.value;
    const nextPasswordConfirm=confirm.value;
    const supabase=window.AccAdminV2?.adminSupabase;

    status.textContent="";
    if(!bookId){status.textContent="請先選擇要管理的帳本。";return;}
    if(!nextPassword){status.textContent="請輸入新的共享密碼。";password.focus();return;}
    if(nextPassword!==nextPasswordConfirm){status.textContent="兩次輸入的共享密碼不一致。";confirm.focus();return;}
    if(!supabase){status.textContent="雲端服務尚未初始化，請重新整理後再試。";return;}

    confirmButton.disabled=true;
    cancelButton.disabled=true;
    status.textContent="正在更新共享密碼……";

    try{
      const {error}=await supabase.rpc("admin_set_shared_book_password",{
        p_book_id:bookId,
        p_password:nextPassword
      });
      if(error)throw error;
      resetFields({keepStatus:true});
      status.textContent="共享密碼已更新；舊的 90 天編輯資格已失效。";
    }catch(error){
      console.error("admin shared password update failed",error);
      status.textContent="共享密碼更新失敗，請稍後再試。";
    }finally{
      confirmButton.disabled=false;
      cancelButton.disabled=false;
    }
  });

  syncSelectedBook();
});
