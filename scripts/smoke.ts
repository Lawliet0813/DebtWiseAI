async function main() {
  try {
    await import('dotenv/config');
  } catch (error) {
    if ((error as { code?: string }).code !== 'ERR_MODULE_NOT_FOUND') {
      console.warn('[smoke] 無法載入 dotenv，請確認是否已安裝相依套件。', error);
    }
  }

  const { supabase } = await import('../src/services/supabaseClient');

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error('尚未登入，請先使用 Supabase Auth 登入後再執行測試。');
  }

  const { data: debt, error } = await supabase
    .from('debts')
    .insert([
      {
        user_id: user.id,
        name: '測試債務',
        balance: 10000,
        original_amount: 10000,
        interest_rate: 10,
        minimum_payment: 1000,
        due_date: null,
        debt_type: 'other',
        status: 'active',
        notes: '由 smoke 測試腳本建立',
      },
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  console.log('OK 新增債務：', debt?.id);
}

main().catch((error) => {
  console.error('[smoke] 測試失敗：', error);
  process.exitCode = 1;
});
