(() => {
  'use strict';

  const lectureTitles = [
    '精神医学の特徴と精神疾患の分類',
    '生物学的精神医学',
    '統合失調症の症状と診断',
    '精神症状の捉え方',
    'リエゾン精神医学',
    '統合失調症の治療',
    'せん妄の臨床',
    '心理検査',
    '気分障害の症状と診断',
    '気分障害の治療',
    '児童・青年期に見られる精神疾患',
    'さまざまな神経症',
    '睡眠覚醒障害',
    '臨床脳波の基礎',
    '精神科地域医療',
    '精神保健福祉法',
    '器質性・症状性精神障害の症状と特徴',
    'てんかん、意識障害の脳波と臨床',
    'さまざまな認知症',
    'アルコール・薬物依存症',
    '青年期の精神疾患の特徴',
  ];

  const diseaseView = document.getElementById('disease-view');
  const lectureView = document.getElementById('lecture-view');
  const tabList = document.getElementById('study-view-tabs');
  const tabs = [...tabList.querySelectorAll('[role="tab"]')];
  const themeCount = document.getElementById('theme-count');
  const storageKey = 'psychiatry-study-view';
  const number = (value) => String(value).padStart(2, '0');
  let currentView = 'disease';

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // カードは複製せず移動するため、解答と開閉状態を両表示で共有できます。
  const cards = [...diseaseView.querySelectorAll('details.qcard')].map((card) => {
    const home = document.createComment(`home:${card.id}`);
    card.before(home);
    return {
      card,
      home,
      question: card.id,
      lecture: Number(card.dataset.lecture),
      diseaseNumber: card.closest('section.theme').querySelector('.index').textContent,
    };
  });
  const questions = [...cards].sort((left, right) => {
    const [leftYear, leftNumber] = left.question.slice(2).split('-').map(Number);
    const [rightYear, rightNumber] = right.question.slice(2).split('-').map(Number);
    return leftYear - rightYear || leftNumber - rightNumber;
  });
  const questionsById = new Map(questions.map((record) => [record.question, record]));

  const introduction = element('p', 'lecture-intro',
    '全150問を年度ごとの独立したカードで表示しています。各講義内は年度・問題番号の昇順です。');
  const lectureToc = element('div', 'toc');
  const lectureSections = lectureTitles.map((title, index) => {
    const lecture = index + 1;
    const section = element('section', 'theme lecture-theme');
    section.id = `lecture-${lecture}`;
    const heading = element('div', 'themehead');
    heading.append(element('span', 'index', number(lecture)), element('h2', 'themetitle', title));
    const count = questions.filter((record) => record.lecture === lecture).length;
    heading.append(element('span', 'lecture-count', `${count}問`));
    section.append(heading);

    const row = element('div', 'tocrow');
    const link = element('a', '', title);
    link.href = `#lecture-${lecture}`;
    row.append(element('span', 'tocidx', number(lecture)), link);
    lectureToc.append(row);
    return section;
  });
  lectureView.append(introduction, lectureToc, ...lectureSections);

  // 独立した問題を持たない補足テーマも、対応する講義で読めるようにします。
  const extras = [[43, 16], [57, 11]].map(([topic, lecture]) => {
    const source = document.getElementById(`topic-${topic}`);
    const explanation = source.querySelector(':scope > .explain');
    const home = document.createComment(`home:topic-${topic}-explanation`);
    explanation.before(home);
    const container = element('div', 'lecture-extra');
    container.append(element('h3', 'subthemetitle', source.querySelector('.themetitle').textContent));
    lectureSections[lecture - 1].append(container);
    return { explanation, home, container };
  });

  const yearLinks = [...document.querySelectorAll('.year_index .indexitem a')].map((link) => {
    const question = link.textContent.match(/202[345]-\d+/)[0];
    const record = questionsById.get(`q-${question}`);
    return { link, question, record };
  });

  function selectView(view, remember = true) {
    if (view !== 'lecture') view = 'disease';
    if (view === 'lecture') {
      for (const record of questions) {
        lectureSections[record.lecture - 1].append(record.card);
      }
      for (const extra of extras) {
        extra.container.append(extra.explanation);
        // 補足は当該講義の問題の後に置きます。
        extra.container.parentElement.append(extra.container);
      }
    } else {
      for (const record of cards) record.home.after(record.card);
      for (const extra of extras) extra.home.after(extra.explanation);
    }
    currentView = view;
    diseaseView.hidden = view !== 'disease';
    lectureView.hidden = view !== 'lecture';
    themeCount.textContent = view === 'lecture' ? '21講義' : '52テーマ';
    tabs.forEach((tab) => {
      const selected = tab.id === `${view}-tab`;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    yearLinks.forEach(({ link, question, record }) => {
      link.href = view === 'lecture' ? `#${record.card.id}` : `#q-${question}`;
      const destination = view === 'lecture'
        ? `講義 ${number(record.lecture)}` : record.diseaseNumber;
      link.textContent = `${question} → ${destination}`;
    });
    if (remember) {
      try { sessionStorage.setItem(storageKey, view); } catch { /* 任意の保存機能 */ }
    }
  }

  function followFragment() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    if (id.startsWith('lecture-') && currentView !== 'lecture') selectView('lecture');
    // 以前の類題紹介カードへのリンクも、独立した問題カードへ引き継ぎます。
    if (id.startsWith('lecture-q-')) id = id.slice('lecture-'.length);
    const target = document.getElementById(id);
    if (!target) return;
    if (id.startsWith('topic-') && currentView !== 'disease') selectView('disease');
    target.scrollIntoView({ block: 'start' });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectView(index === 0 ? 'disease' : 'lecture'));
    tab.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') next = 1 - index;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = 1;
      if (next === undefined) return;
      event.preventDefault();
      selectView(next === 0 ? 'disease' : 'lecture');
      tabs[next].focus();
    });
  });
  window.addEventListener('hashchange', followFragment);

  let savedView = 'disease';
  try { savedView = sessionStorage.getItem(storageKey) || savedView; } catch { /* 初期表示を使う */ }
  selectView(savedView, false);
  tabList.hidden = false;
  if (location.hash) followFragment();
})();
