<script setup>
import { ref, onMounted } from 'vue'

// 状態管理
const token = ref(localStorage.getItem('token') || '')
const view = ref('list') // 'list', 'login', 'register'
const memos = ref([])
const form = ref({ email: '', password: '', title: '', content: '' })
const editingId = ref(null)

// APIリクエスト用ヘルパー
const api = async (url, options = {}) => {
  const headers = { 'Content-Type': 'application/json' }
  if (token.value) headers['Authorization'] = `Bearer ${token.value}`

  const res = await fetch(`/api${url}`, { ...options, headers })
  if (res.status === 401) logout()
  return res
}

// 認証系
const register = async () => {
  const res = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email: form.value.email, password: form.value.password })
  })
  if (res.ok) {
    alert('登録しました。ログインしてください。')
    view.value = 'login'
  } else {
    alert('登録エラー')
  }
}

const login = async () => {
  const res = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: form.value.email, password: form.value.password })
  })
  if (res.ok) {
    const data = await res.json()
    token.value = data.token
    localStorage.setItem('token', data.token)
    form.value.password = '' // パスワードクリア
    fetchMemos()
  } else {
    alert('ログイン失敗')
  }
}

const logout = () => {
  token.value = ''
  localStorage.removeItem('token')
  memos.value = []
  view.value = 'login'
}

// メモ操作系
const fetchMemos = async () => {
  if (!token.value) return
  const res = await api('/memos')
  if (res.ok) memos.value = await res.json()
  view.value = 'list'
}

const saveMemo = async () => {
  if (!form.value.content) return alert('内容は必須です')

  const body = JSON.stringify({ title: form.value.title, content: form.value.content })
  let res;

  if (editingId.value) {
    // 編集
    res = await api(`/memos/${editingId.value}`, { method: 'PUT', body })
  } else {
    // 新規
    res = await api('/memos', { method: 'POST', body })
  }

  // エラーチェックを追加
  if (!res.ok) {
    const errorData = await res.json();
    alert(`エラーが発生しました: ${errorData.error}`);
    return;
  }

  form.value.title = ''
  form.value.content = ''
  editingId.value = null
  fetchMemos()
}

const deleteMemo = async (id) => {
  if(!confirm('削除しますか？')) return

  const res = await api(`/memos/${id}`, { method: 'DELETE' })

  // エラーチェックを追加
  if (!res.ok) {
    const errorData = await res.json();
    alert(`削除に失敗しました: ${errorData.error}`);
    return;
  }

  fetchMemos()
}

const startEdit = (memo) => {
  form.value.title = memo.title
  form.value.content = memo.content
  editingId.value = memo.id
  window.scrollTo(0,0) // 上部へ移動
}

// 初期化
onMounted(() => {
  if (token.value) fetchMemos()
  else view.value = 'login'
})
</script>

<template>
  <div class="min-h-screen bg-zinc-950 p-6 font-sans text-zinc-100">
    <div class="mx-auto max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

      <!-- Header -->
      <div class="mb-6 flex items-center justify-between border-b border-zinc-800 pb-4">
        <h1 class="text-xl font-semibold tracking-tight text-zinc-100">
          ViteMemo
        </h1>
        <button
          v-if="token"
          @click="logout"
          class="text-sm text-zinc-400 hover:text-red-400 transition"
        >
          ログアウト
        </button>
      </div>

      <!-- Auth -->
      <div v-if="!token">
        <h2 class="mb-4 text-lg font-medium text-zinc-300">
          {{ view === 'login' ? 'ログイン' : '新規登録' }}
        </h2>

        <input
          v-model="form.email"
          type="email"
          placeholder="Email"
          class="mb-3 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
        />

        <input
          v-model="form.password"
          type="password"
          placeholder="Password"
          class="mb-4 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
        />

        <button
          v-if="view === 'login'"
          @click="() => { console.log('clicked'); login(); }"
          class="w-full rounded-md bg-zinc-800 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-700 transition"
        >
          ログイン
        </button>

        <button
          v-else
          @click="register"
          class="w-full rounded-md bg-zinc-800 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-700 transition"
        >
          登録する
        </button>

        <p
          class="mt-4 cursor-pointer text-center text-sm text-zinc-500 hover:text-zinc-300 transition"
          @click="view = view === 'login' ? 'register' : 'login'"
        >
          {{ view === 'login' ? 'アカウントをお持ちでない方はこちら' : 'ログインはこちら' }}
        </p>
      </div>

      <!-- Memo -->
      <div v-else>
        <!-- Editor -->
        <div class="mb-8 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <h3 class="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            {{ editingId ? 'メモを編集' : '新しいメモ' }}
          </h3>

          <input
            v-model="form.title"
            placeholder="タイトル (任意)"
            class="mb-2 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
          />

          <textarea
            v-model="form.content"
            placeholder="メモの内容..."
            class="mb-3 h-24 w-full resize-none rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
          />

          <div class="flex gap-2">
            <button
              @click="saveMemo"
              class="flex-1 rounded-md bg-zinc-800 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-700 transition"
            >
              {{ editingId ? '更新' : '追加' }}
            </button>

            <button
              v-if="editingId"
              @click="editingId = null; form.title=''; form.content=''"
              class="rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-700 transition"
            >
              キャンセル
            </button>
          </div>
        </div>

        <!-- Memo List -->
        <div class="space-y-4">
          <div
            v-for="memo in memos"
            :key="memo.id"
            class="group relative rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition hover:bg-zinc-800"
          >
            <h3 class="mb-1 text-lg font-medium text-zinc-100">
              {{ memo.title || '（無題）' }}
            </h3>

            <p class="mb-3 whitespace-pre-wrap text-sm text-zinc-400">
              {{ memo.content }}
            </p>

            <div class="flex items-center justify-between text-xs text-zinc-500">
              <span>{{ new Date(memo.created_at).toLocaleString() }}</span>
              <div class="space-x-3 opacity-0 transition group-hover:opacity-100">
                <button
                  @click="startEdit(memo)"
                  class="text-blue-400 hover:text-blue-300"
                >
                  編集
                </button>
                <button
                  @click="deleteMemo(memo.id)"
                  class="text-red-400 hover:text-red-300"
                >
                  削除
                </button>
              </div>
            </div>
          </div>

          <p
            v-if="memos.length === 0"
            class="text-center text-sm text-zinc-500"
          >
            メモがありません
          </p>
        </div>
      </div>

    </div>
  </div>
</template>

