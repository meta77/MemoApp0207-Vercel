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

  if (editingId.value) {
    // 編集
    await api(`/memos/${editingId.value}`, { method: 'PUT', body })
  } else {
    // 新規
    await api('/memos', { method: 'POST', body })
  }

  form.value.title = ''
  form.value.content = ''
  editingId.value = null
  fetchMemos()
}

const deleteMemo = async (id) => {
  if(!confirm('削除しますか？')) return
  await api(`/memos/${id}`, { method: 'DELETE' })
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
  <div class="min-h-screen bg-gray-100 p-4 font-sans text-gray-800">
    <div class="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">

      <div class="flex justify-between items-center mb-6 border-b pb-4">
        <h1 class="text-xl font-bold text-indigo-600">ViteMemo</h1>
        <button v-if="token" @click="logout" class="text-sm text-red-500 hover:underline">ログアウト</button>
      </div>

      <div v-if="!token">
        <h2 class="text-lg font-semibold mb-4">{{ view === 'login' ? 'ログイン' : '新規登録' }}</h2>
        <input v-model="form.email" type="email" placeholder="Email" class="w-full p-2 mb-3 border rounded">
        <input v-model="form.password" type="password" placeholder="Password" class="w-full p-2 mb-4 border rounded">

        <button v-if="view === 'login'" @click="login" class="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700">ログイン</button>
        <button v-else @click="register" class="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">登録する</button>

        <p class="mt-4 text-center text-sm text-gray-600 cursor-pointer hover:underline"
           @click="view = view === 'login' ? 'register' : 'login'">
           {{ view === 'login' ? 'アカウントをお持ちでない方はこちら' : 'ログインはこちら' }}
        </p>
      </div>

      <div v-else>
        <div class="mb-8 bg-gray-50 p-4 rounded-lg">
          <h3 class="font-bold mb-2 text-sm text-gray-500">{{ editingId ? 'メモを編集' : '新しいメモ' }}</h3>
          <input v-model="form.title" placeholder="タイトル (任意)" class="w-full p-2 mb-2 border rounded text-sm">
          <textarea v-model="form.content" placeholder="メモの内容..." class="w-full p-2 mb-2 border rounded h-24 text-sm"></textarea>
          <div class="flex gap-2">
            <button @click="saveMemo" class="flex-1 bg-indigo-600 text-white p-2 rounded text-sm hover:bg-indigo-700">
              {{ editingId ? '更新' : '追加' }}
            </button>
            <button v-if="editingId" @click="editingId = null; form.title=''; form.content=''" class="px-4 py-2 bg-gray-300 rounded text-sm">キャンセル</button>
          </div>
        </div>

        <div class="space-y-4">
          <div v-for="memo in memos" :key="memo.id" class="border p-4 rounded hover:shadow-sm transition bg-white relative group">
            <h3 class="font-bold text-lg mb-1">{{ memo.title || '（無題）' }}</h3>
            <p class="text-gray-700 whitespace-pre-wrap mb-2">{{ memo.content }}</p>
            <div class="text-xs text-gray-400 flex justify-between items-center">
              <span>{{ new Date(memo.created_at).toLocaleString() }}</span>
              <div class="space-x-2">
                <button @click="startEdit(memo)" class="text-indigo-500 hover:text-indigo-700">編集</button>
                <button @click="deleteMemo(memo.id)" class="text-red-400 hover:text-red-600">削除</button>
              </div>
            </div>
          </div>
          <p v-if="memos.length === 0" class="text-center text-gray-400 text-sm">メモがありません</p>
        </div>
      </div>

    </div>
  </div>
</template>