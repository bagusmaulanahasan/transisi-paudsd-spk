<script>
  import { onMount } from 'svelte'
  import { supabase } from '$lib/supabase'

  let stats = { classes: 0, students: 0, criteria: 6 }

  onMount(async () => {
    const { count: classCount } = await supabase.from('classes').select('*', { count: 'exact', head: true })
    const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true })
    stats.classes = classCount || 0
    stats.students = studentCount || 0
  })
</script>

<div class="max-w-6xl mx-auto">
  <h1 class="text-2xl font-bold text-slate-900 mb-6">Dashboard Utama</h1>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <div class="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
      <h3 class="text-sm font-medium text-slate-500">Total Kriteria</h3>
      <p class="text-3xl font-bold text-slate-900 mt-2">{stats.criteria}</p>
    </div>
    <div class="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
      <h3 class="text-sm font-medium text-slate-500">Total Kelas</h3>
      <p class="text-3xl font-bold text-slate-900 mt-2">{stats.classes}</p>
    </div>
    <div class="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
      <h3 class="text-sm font-medium text-slate-500">Total Anak</h3>
      <p class="text-3xl font-bold text-slate-900 mt-2">{stats.students}</p>
    </div>
  </div>

  <div class="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
    <h2 class="text-lg font-bold text-slate-900 mb-2">Selamat Datang di SPK Transisi PAUD-SD</h2>
    <p class="text-slate-600 text-sm leading-relaxed">
      Sistem ini menggunakan metode Hybrid AHP (Analytical Hierarchy Process) untuk pembobotan kriteria dan MOORA (Multi-Objective Optimization on the Basis of Ratio Analysis) untuk perankingan penentuan prioritas anak dalam stimulasi transisi PAUD-SD di TK Islam Kencana.
    </p>
  </div>
</div>
