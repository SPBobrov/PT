// public/js/history.js

let allSessions = [];
let activities = [];
const DISPLAY_LIMIT = 10; // сколько последних записей показывать

async function loadData() {
  try {
    const [sessionsRes, activitiesRes] = await Promise.all([
      fetch('/api/sessions'),
      fetch('/api/activities')
    ]);
    allSessions = await sessionsRes.json();
    activities = await activitiesRes.json();

    populateActivityFilter();
    populateChartActivities();
    populateActivitySelect();
    // Показываем последние записи при загрузке
    renderTable(allSessions);
  } catch (err) {
    console.error('Ошибка загрузки данных:', err);
  }
}

function populateActivityFilter() {
  const select = document.getElementById('filter-activity');
  if (!select) return;
  select.innerHTML = '<option value="">Все</option>';
  activities.forEach(act => {
    const option = document.createElement('option');
    option.value = act.name;
    option.textContent = act.name;
    select.appendChild(option);
  });
}

function populateChartActivities() {
  const select = document.getElementById('chart-activities');
  if (!select) return;
  select.innerHTML = '';
  activities.forEach(act => {
    const option = document.createElement('option');
    option.value = act.name;
    option.textContent = act.name;
    select.appendChild(option);
  });
  if (select.options.length > 0) {
    select.options[0].selected = true;
  }
}

function populateActivitySelect() {
  const select = document.getElementById('session-activity');
  if (!select) return;
  select.innerHTML = '';
  activities.forEach(act => {
    const option = document.createElement('option');
    option.value = act.name;
    option.textContent = act.name;
    select.appendChild(option);
  });
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  return `${mins} мин`;
}

function formatDateTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function renderTable(filteredSessions) {
  const tbody = document.getElementById('sessions-list');
  if (!tbody) return;

  // Берём последние DISPLAY_LIMIT записей (они уже отсортированы по убыванию даты)
  const displaySessions = filteredSessions.slice(0, DISPLAY_LIMIT);

  if (displaySessions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px;">Нет записей</td></tr>';
    return;
  }

  tbody.innerHTML = displaySessions.map(s => `
    <tr>
      <td>${formatDateTime(s.timestamp)}</td>
      <td>${s.activityType}</td>
      <td>${formatDuration(s.duration)}</td>
      <td>${s.comment || ''}</td>
      <td>
        <button class="edit-session btn-icon" data-id="${s.id}" title="Редактировать">✏️</button>
        <button class="delete-session btn-icon" data-id="${s.id}" title="Удалить">🗑️</button>
      </td>
    </tr>
  `).join('');

  // Если всего записей больше лимита, добавляем информационную строку
  if (filteredSessions.length > DISPLAY_LIMIT) {
    const infoRow = document.createElement('tr');
    infoRow.innerHTML = `<td colspan="5" style="text-align:center; font-style:italic; color:#666;">Показаны последние ${DISPLAY_LIMIT} из ${filteredSessions.length} записей</td>`;
    tbody.appendChild(infoRow);
  }

  document.querySelectorAll('.edit-session').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      const session = allSessions.find(s => s.id == id);
      if (session) openEditModal(session);
    });
  });

  document.querySelectorAll('.delete-session').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      if (!confirm('Удалить запись?')) return;
      const response = await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      if (response.ok) {
        allSessions = allSessions.filter(s => s.id != id);
        renderTable(allSessions);
      } else {
        alert('Ошибка удаления');
      }
    });
  });
}

function openAddModal() {
  document.getElementById('session-id').value = '';
  document.getElementById('modal-title').textContent = 'Добавить запись';
  document.getElementById('session-datetime').value = '';
  document.getElementById('session-minutes').value = '';
  document.getElementById('session-comment').value = '';
  const select = document.getElementById('session-activity');
  if (select.options.length > 0) select.selectedIndex = 0;
  document.getElementById('session-modal').style.display = 'flex';
}

function openEditModal(session) {
  document.getElementById('session-id').value = session.id;
  document.getElementById('modal-title').textContent = 'Редактировать запись';
  const dt = new Date(session.timestamp);
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  const hours = String(dt.getHours()).padStart(2, '0');
  const minutes = String(dt.getMinutes()).padStart(2, '0');
  document.getElementById('session-datetime').value = `${year}-${month}-${day}T${hours}:${minutes}`;
  document.getElementById('session-minutes').value = Math.floor(session.duration / 60);
  document.getElementById('session-comment').value = session.comment || '';

  const select = document.getElementById('session-activity');
  for (let i = 0; i < select.options.length; i++) {
    if (select.options[i].value === session.activityType) {
      select.selectedIndex = i;
      break;
    }
  }

  document.getElementById('session-modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('session-modal').style.display = 'none';
}

function applyFilter() {
  const dateFilter = document.getElementById('filter-date').value;
  const activityFilter = document.getElementById('filter-activity').value;

  let filtered = allSessions;

  if (dateFilter) {
    filtered = filtered.filter(s => s.timestamp.startsWith(dateFilter));
  }

  if (activityFilter) {
    filtered = filtered.filter(s => s.activityType === activityFilter);
  }

  renderTable(filtered);
}

function showTotalTime() {
  const selectedOptions = Array.from(document.getElementById('chart-activities').selectedOptions).map(opt => opt.value);
  const startDate = document.getElementById('chart-start-date').value;
  const endDate = document.getElementById('chart-end-date').value;

  if (selectedOptions.length === 0) {
    alert('Выберите хотя бы одну активность');
    return;
  }

  let filtered = allSessions.filter(s => selectedOptions.includes(s.activityType));

  if (startDate) {
    filtered = filtered.filter(s => s.timestamp.split('T')[0] >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter(s => s.timestamp.split('T')[0] <= endDate);
  }

  const totalSeconds = filtered.reduce((acc, s) => acc + s.duration, 0);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const sessionsCount = filtered.length;

  let resultText = '';
  if (totalMinutes === 0) {
    resultText = 'Нет данных за выбранный период';
  } else {
    resultText = `Всего: ${hours} ч ${minutes} мин (${sessionsCount} сессий)`;
  }

  const displayDiv = document.getElementById('total-time-display');
  if (displayDiv) {
    displayDiv.textContent = resultText;
  }
}

function toggleDetails() {
  const content = document.getElementById('details-content');
  const btn = document.getElementById('toggle-details');
  if (content.style.display === 'none' || content.style.display === '') {
    content.style.display = 'block';
    btn.textContent = 'Скрыть детали';
  } else {
    content.style.display = 'none';
    btn.textContent = 'Показать детали';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('toggle-details')?.addEventListener('click', toggleDetails);
  document.getElementById('apply-filter')?.addEventListener('click', applyFilter);
  document.getElementById('reset-filter')?.addEventListener('click', () => {
    document.getElementById('filter-date').value = '';
    document.getElementById('filter-activity').value = '';
    renderTable(allSessions);
  });
  document.getElementById('build-chart')?.addEventListener('click', showTotalTime);
  document.getElementById('add-session-btn')?.addEventListener('click', openAddModal);
  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);

  document.getElementById('session-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('session-id').value;
    const activity = document.getElementById('session-activity').value;
    const minutes = parseInt(document.getElementById('session-minutes').value);
    const comment = document.getElementById('session-comment').value;
    const datetime = document.getElementById('session-datetime').value;

    if (!activity || !minutes || !datetime) {
      alert('Заполните все обязательные поля');
      return;
    }

    const data = {
      activityType: activity,
      duration: minutes * 60,
      comment: comment,
      timestamp: new Date(datetime).toISOString()
    };

    const url = id ? `/api/sessions/${id}` : '/api/sessions';
    const method = id ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      closeModal();
      loadData();
    } else {
      const err = await response.json();
      alert('Ошибка сохранения: ' + (err.error || 'неизвестная ошибка'));
    }
  });

  loadData();
});