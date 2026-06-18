import { supabase } from "./supabase.js";

function switchTab(id,el){document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));el.classList.add('active');document.getElementById('panel-'+id).classList.add('active')}

const bids=[];

async function addBid() {
  const n = document.getElementById('bid-name').value.trim();
  if (!n) return;
  const bid = {
    name: n,
    client: document.getElementById('bid-client').value || '—',
    value: parseFloat(document.getElementById('bid-val').value) || null,
    deadline: document.getElementById('bid-deadline').value || '—',
    score: parseInt(document.getElementById('bid-score').value) || 0,
    status: document.getElementById('bid-status').value
  };
  const { error } = await supabase.from('bids').insert([bid]);
  if (error) { console.error(error); alert('Failed to save bid'); return; }
  clearBidForm();
  await loadBids();
}

function clearBidForm(){['bid-name','bid-client','bid-val','bid-deadline','bid-score'].forEach(id=>document.getElementById(id).value='')}

function renderBids(){
  const body=document.getElementById('bid-body');
  if(!bids.length){
    body.innerHTML='<tr><td colspan="8" style="text-align:center;color:var(--faint);padding:20px">No bids logged. Add above.</td></tr>';
  } else {
    body.innerHTML=bids.map((b)=>`<tr style="cursor:pointer" onclick="openBidModal(${b.id})">
      <td style="font-weight:500">${b.name}</td>
      <td>${b.client}</td>
      <td>${b.value != null ? 'R '+Number(b.value).toLocaleString() : '—'}</td>
      <td>${b.deadline || '—'}</td>
      <td><strong>${b.score}/100</strong></td>
      <td>${b.score>=60?'<span class="badge bgo">GO</span>':b.score>0?'<span class="badge bnogo">No-Go</span>':'—'}</td>
      <td><span class="badge bb">${b.status}</span></td>
      <td><button class="btn bsm btnd" onclick="event.stopPropagation();deleteBid(${b.id})">✕</button></td>
    </tr>`).join('');
  }
  updateMonKPIs();
  renderGNG();
  populateBidDropdown();
}

function updateMonKPIs(){const go=bids.filter(b=>b.score>=60);const nogo=bids.filter(b=>b.score>0&&b.score<60);const sub=bids.filter(b=>b.status==='Submitted'||b.status==='Awarded').length;document.getElementById('m-pipeline').textContent=bids.length;document.getElementById('m-submitted').textContent=sub;document.getElementById('m-go').textContent=go.length;document.getElementById('m-nogo').textContent=nogo.length;const pipeTotal = go.reduce((s,b)=>s+(b.value||0),0);
const pipeFmt = pipeTotal >= 1000000 ? 'R '+( pipeTotal/1000000).toFixed(1)+'M' : pipeTotal >= 1000 ? 'R '+Math.round(pipeTotal/1000)+'k' : 'R '+pipeTotal.toLocaleString();
document.getElementById('m-pipeval').textContent = go.length ? pipeFmt : 'R 0';document.getElementById('bid-count').textContent=bids.length+' bid'+(bids.length!==1?'s':'')}
function renderGNG(){const low=bids.filter(b=>b.score>0&&b.score<60);const el=document.getElementById('gng-list');el.innerHTML=low.length?low.map(b=>`<div class="ri"><div class="rag ra" style="margin-top:4px"></div><div style="flex:1;margin-left:8px"><div class="rlbl">${b.name}</div><div class="rsub">${b.client} · Score: ${b.score}/100 — review or improve</div></div><span class="badge ba">Review</span></div>`).join(''):'<div style="color:var(--faint);font-size:13px;padding:8px 0">No borderline bids requiring review</div>'}
function toggleLib(){const e=document.getElementById('lib-edit');e.style.display=e.style.display==='none'?'block':'none'}
function updateLib(){[['c','lc'],['v','lv'],['m','lm'],['s','ls'],['p','lp']].forEach(([k,id])=>{const v=Math.min(100,Math.max(0,parseInt(document.getElementById('le-'+k).value)||0));document.getElementById(id+'-bar').style.width=v+'%';document.getElementById(id+'-bar').className='pf '+(v>=70?'pfg':v>=40?'pfa':'pfr');document.getElementById(id+'-pct').textContent=v+'%'});document.getElementById('lib-edit').style.display='none'}
function setRAG(p,v){document.getElementById('dot-'+p).className='rag '+(v==='g'?'rg':v==='a'?'ra':'rr');document.getElementById('bar-'+p).className='pf '+(v==='g'?'pfg':v==='a'?'pfa':'pfr')}
function addProject(){const n=prompt('Project name:');if(!n)return;const id='p'+Date.now();const div=document.createElement('div');div.className='pb';div.innerHTML=`<div class="pbh"><div class="rag rb" id="dot-${id}"></div><div class="pbn">${n}</div><select style="width:90px;font-size:12px;padding:4px 6px" onchange="setRAG('${id}',this.value)"><option value="g">Green</option><option value="a">Amber</option><option value="r">Red</option></select></div><div style="font-size:12px;color:var(--muted);margin-bottom:8px">New project — update details</div><div class="prog"><div class="pf pfb" id="bar-${id}" style="width:0%"></div></div>`;document.getElementById('project-cards').appendChild(div);document.getElementById('t-active').textContent=parseInt(document.getElementById('t-active').textContent)+1}
function addCE(){const p=document.getElementById('ce-proj').value.trim();const d=document.getElementById('ce-desc').value.trim();if(!p||!d)return;const v=parseInt(document.getElementById('ce-val').value)||0;const a=parseInt(document.getElementById('ce-age').value)||0;const cls=a>21?'bnogo':a>10?'ba':'bgo';const lbl=a>21?'Escalate':a>10?'Submit':'New';const tr=document.createElement('tr');tr.innerHTML=`<td>${p}</td><td>${d}</td><td>${v?'R '+v.toLocaleString():'—'}</td><td>${a} days</td><td><span class="badge ${cls}">${lbl}</span></td><td><button class="btn bsm btnd" onclick="this.closest('tr').remove()">✕</button></td>`;document.getElementById('ce-body').appendChild(tr);['ce-proj','ce-desc','ce-val','ce-age'].forEach(id=>document.getElementById(id).value='');document.getElementById('t-ces').textContent=parseInt(document.getElementById('t-ces').textContent)+1}
const customBlockers=[];
function addBlocker(){const p=document.getElementById('blk-proj').value.trim();const d=document.getElementById('blk-desc').value.trim();if(!p||!d)return;customBlockers.push({p,d,o:document.getElementById('blk-own').value});renderBlockers();document.getElementById('blk-proj').value='';document.getElementById('blk-desc').value=''}
function renderBlockers(){document.getElementById('blocker-list').innerHTML='<div class="ri"><div class="rag rr" style="margin-top:4px"></div><div style="flex:1;margin-left:8px"><div class="rlbl">Camden — Client has not signed CE #004</div><div class="rsub">Owner: Director · Day 28 · Escalate to Eskom SPM today</div></div></div><div class="ri"><div class="rag ra" style="margin-top:4px"></div><div style="flex:1;margin-left:8px"><div class="rlbl">Majuba — Inspection certificate outstanding</div><div class="rsub">Owner: Ops Coord · Day 12 · Email chase today</div></div></div>'+customBlockers.map(b=>`<div class="ri"><div class="rag ra" style="margin-top:4px"></div><div style="flex:1;margin-left:8px"><div class="rlbl">${b.p} — ${b.d}</div><div class="rsub">Owner: ${b.o} · New</div></div></div>`).join('');document.getElementById('t-blockers').textContent=2+customBlockers.length}
function calcNet(){const c=parseFloat(document.getElementById('w-cash').value)||0;const e=parseFloat(document.getElementById('w-exp').value)||0;const o=parseFloat(document.getElementById('w-oh').value)||0;const net=c+e-o;const el=document.getElementById('w-net');const sub=document.getElementById('w-ns');if(c||e||o){el.textContent='R '+Math.round(net).toLocaleString();el.className='kval '+(net>=0?'cg':'cr');sub.textContent=net>=0?'Positive — on track':'WARNING: shortfall';sub.style.color=net>=0?'var(--green)':'var(--red)'}else{el.textContent='Enter above';el.className='kval';sub.textContent=''}}
function calcRet(){let t=0;document.querySelectorAll('#panel-wed .cfr input[type=number]').forEach(i=>{t+=parseFloat(i.value)||0});document.getElementById('ret-total').textContent='R '+Math.round(t).toLocaleString()}
function markPaid(btn){const r=btn.closest('tr');r.style.opacity='.4';r.style.textDecoration='line-through';btn.textContent='✓ Cleared';btn.disabled=true;recalcDeb()}
function addDebtor(){const c=document.getElementById('deb-cl').value.trim();if(!c)return;const a=parseFloat(document.getElementById('deb-amt').value)||0;const age=parseInt(document.getElementById('deb-age').value)||0;const inv=document.getElementById('deb-inv').value||'—';const cls=age>30?'bnogo':age>14?'ba':'bgo';const tr=document.createElement('tr');tr.innerHTML=`<td>${c}</td><td>${inv}</td><td>R ${Math.round(a).toLocaleString()}</td><td><span class="badge ${cls}">${age} days</span></td><td>Outstanding</td><td><button class="btn bsm btnd" onclick="markPaid(this)">Paid ✓</button></td>`;document.getElementById('deb-body').appendChild(tr);['deb-cl','deb-inv','deb-amt','deb-age'].forEach(id=>document.getElementById(id).value='');recalcDeb()}
function recalcDeb(){let t=0;document.querySelectorAll('#deb-body tr').forEach(tr=>{if(tr.style.textDecoration==='line-through')return;const c=tr.cells[2];if(c){const v=c.textContent.replace(/[^0-9]/g,'');if(v)t+=parseInt(v)}});document.getElementById('deb-total').textContent='R '+t.toLocaleString()}
function updateFri(){const b=parseInt(document.getElementById('kf-b').value)||0;const rev=parseFloat(document.getElementById('kf-rev').value)||0;const oh=parseFloat(document.getElementById('kf-oh').value)||0;const rc=parseInt(document.getElementById('kf-rc').value)||0;const wr=parseInt(document.getElementById('kf-wr').value)||0;const aw=parseInt(document.getElementById('kf-aw').value)||0;document.getElementById('f-bids').textContent=b||'—';document.getElementById('f-retc').textContent=rc||'—';document.getElementById('f-wroom').textContent=wr?wr+'/4':'—';document.getElementById('f-awards').textContent=aw||'—';if(rev&&oh){const r=((oh/rev)*100).toFixed(1);const good=parseFloat(r)<18;const el=document.getElementById('f-ratio');el.textContent=r+'%';el.className='kval '+(good?'cg':'cr');const calc=document.getElementById('f-calc');calc.textContent=r+'%';calc.style.color=good?'var(--green)':'var(--red)'}else{document.getElementById('f-ratio').textContent='—';document.getElementById('f-ratio').className='kval';document.getElementById('f-calc').textContent='—';document.getElementById('f-calc').style.color='var(--navy)'}}
const customDecs=[];
function saveDecision(){const t=document.getElementById('dec-txt').value.trim();if(!t)return;customDecs.push({t,p:document.getElementById('dec-pri').value});renderDecisions();document.getElementById('dec-txt').value='';document.getElementById('dec-form').style.display='none'}
function renderDecisions(){const fixed=`<li><input type="checkbox"><span><span class="badge bnogo" style="margin-right:6px">High</span>Approve Camden escalation — client call required this week</span></li><li><input type="checkbox"><span><span class="badge bnogo" style="margin-right:6px">High</span>Sign off Commercial &amp; Bid Manager appointment</span></li><li><input type="checkbox"><span><span class="badge ba" style="margin-right:6px">Medium</span>Review overhead audit — confirm reductions</span></li><li><input type="checkbox"><span><span class="badge ba" style="margin-right:6px">Medium</span>Approve revolving bid fund R 100 000</span></li>`;document.getElementById('decision-list').innerHTML=fixed+customDecs.map(d=>{const cls=d.p==='High'?'bnogo':d.p==='Medium'?'ba':'bgo';return`<li><input type="checkbox"><span><span class="badge ${cls}" style="margin-right:6px">${d.p}</span>${d.t}</span></li>`}).join('')}

async function deleteBid(id){
  await supabase.from('bids').delete().eq('id', id);
  await loadBids();
}

async function loadBids() {
  const { data, error } = await supabase.from('bids').select('*');
  if (error) { console.error(error); return; }
  bids.length = 0;
  data.forEach(b => bids.push(b));
  renderBids();
}

loadBids();

// ── CRM ──────────────────────────────────────────────────────────────
const contacts = [];

async function addContact() {
  const n = document.getElementById('crm-name').value.trim();
  if (!n) return;
  const contact = {
    name: n,
    company: document.getElementById('crm-company').value || '—',
    role: document.getElementById('crm-role').value || '—',
    phone: document.getElementById('crm-phone').value || '—',
    email: document.getElementById('crm-email').value || '—',
    stage: document.getElementById('crm-stage').value,
    opportunity_value: parseInt(document.getElementById('crm-oppval-input').value) || 0,
    followup_date: document.getElementById('crm-followup').value || '—',
    notes: document.getElementById('crm-notes').value || ''
  };
  const { error } = await supabase.from('contacts').insert([contact]);
  if (error) { console.error(error); alert('Failed to save: ' + error.message); return; }
  clearCRMForm();
  await loadContacts();
}

function clearCRMForm() {
  ['crm-name','crm-company','crm-role','crm-phone','crm-email','crm-oppval-input','crm-followup','crm-notes'].forEach(id => document.getElementById(id).value = '');
}

async function deleteContact(id) {
  await supabase.from('contacts').delete().eq('id', id);
  await loadContacts();
}

function renderContacts() {
  const body = document.getElementById('crm-body');
  if (!contacts.length) {
    body.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--faint);padding:20px">No contacts yet. Add above.</td></tr>';
  } else {
    body.innerHTML = contacts.map(c => {
      const stageClass = c.stage === 'Active Client' ? 'bgo' : c.stage === 'Lead' ? 'bb' : c.stage === 'Prospect' ? 'ba' : 'bnogo';
      return `<tr style="cursor:pointer" onclick="openContactModal(${c.id})">
        <td style="font-weight:500">${c.name}</td>
        <td>${c.company}</td>
        <td>${c.role}</td>
        <td>${c.phone}</td>
        <td><span class="badge ${stageClass}">${c.stage}</span></td>
        <td>${c.opportunity_value ? 'R ' + c.opportunity_value.toLocaleString() : '—'}</td>
        <td>${c.followup_date}</td>
        <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.notes || '—'}</td>
        <td><button class="btn bsm btnd" onclick="event.stopPropagation();deleteContact(${c.id})">✕</button></td>
      </tr>`;
    }).join('');
  }
  updateCRMKPIs();
  renderFollowUps();
  renderPipelineBar();
  populateContactDropdown();
}

function updateCRMKPIs() {
  const opps = contacts.filter(c => c.stage !== 'Inactive');
  const oppVal = opps.reduce((s, c) => s + (c.opportunity_value || 0), 0);
  const today = new Date(); today.setHours(0,0,0,0);
  const due = contacts.filter(c => {
    if (!c.followup_date || c.followup_date === '—') return false;
    return new Date(c.followup_date) <= today;
  });
  const inactive = contacts.filter(c => c.stage === 'Inactive');
  document.getElementById('crm-total').textContent = contacts.length;
  document.getElementById('crm-opps').textContent = opps.length;
  document.getElementById('crm-followups').textContent = due.length;
  const oppFmt = oppVal >= 1000000 ? 'R '+(oppVal/1000000).toFixed(1)+'M' : oppVal >= 1000 ? 'R '+Math.round(oppVal/1000)+'k' : 'R '+oppVal.toLocaleString();
document.getElementById('crm-oppval').textContent = oppVal ? oppFmt : 'R 0';
  document.getElementById('crm-inactive').textContent = inactive.length;
  document.getElementById('crm-count').textContent = contacts.length + ' contact' + (contacts.length !== 1 ? 's' : '');
}

function renderFollowUps() {
  const today = new Date(); today.setHours(0,0,0,0);
  const due = contacts.filter(c => {
    if (!c.followup_date || c.followup_date === '—') return false;
    return new Date(c.followup_date) <= today;
  });
  const el = document.getElementById('crm-followup-list');
  el.innerHTML = due.length ? due.map(c => `
    <div class="ri">
      <div class="rag rr" style="margin-top:4px"></div>
      <div style="flex:1;margin-left:8px">
        <div class="rlbl">${c.name} — ${c.company}</div>
        <div class="rsub">${c.role} · Follow-up: ${c.followup_date} · ${c.notes || 'No notes'}</div>
      </div>
      <span class="badge bnogo">Call now</span>
    </div>`).join('') : '<div style="color:var(--faint);font-size:13px;padding:8px 0">No follow-ups due today</div>';
}

function renderPipelineBar() {
  const stages = ['Lead', 'Prospect', 'Active Client', 'Inactive'];
  const ids = ['lead', 'prospect', 'active', 'inactive'];
  const total = contacts.length || 1;
  stages.forEach((s, i) => {
    const count = contacts.filter(c => c.stage === s).length;
    const pct = Math.round((count / total) * 100);
    document.getElementById('crm-bar-' + ids[i]).style.width = pct + '%';
    document.getElementById('crm-n-' + ids[i]).textContent = count;
  });
}

async function loadContacts() {
  const { data, error } = await supabase.from('contacts').select('*');
  if (error) { console.error(error); return; }
  contacts.length = 0;
  data.forEach(c => contacts.push(c));
  renderContacts();
}

loadContacts();

// ── Document upload helpers ───────────────────────────────────────────
function renderDocsHTML(docs) {
  if (!docs || !docs.length) return '<div style="color:var(--faint);font-size:13px">No documents uploaded yet</div>';
  const catColors = { commercial: '#DBEAFE', technical: '#DCFCE7', financial: '#FEF3C7' };
  const catText   = { commercial: '#1D4ED8', technical: '#15803D', financial: '#B45309' };
  return docs.map(d => `
    <div class="doc-item">
      <span>📄</span>
      <a href="${d.url}" target="_blank" style="flex:1;color:var(--navy);text-decoration:none;font-weight:500">${d.name}</a>
      <span class="doc-cat" style="background:${catColors[d.category]||'#f3f4f6'};color:${catText[d.category]||'#374151'}">${d.category.charAt(0).toUpperCase()+d.category.slice(1)}</span>
    </div>`).join('');
}

async function uploadDoc(file, category, recordId, recordType) {
  const filePath = `${recordType}/${recordId}/${category}/${Date.now()}_${file.name}`;
  const { error: upErr } = await supabase.storage.from('documents').upload(filePath, file, { upsert: true });
  if (upErr) { alert('Upload failed: ' + upErr.message); return false; }
  const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
  const { error: dbErr } = await supabase.from('documents').insert([{
    record_id: recordId, record_type: recordType,
    name: file.name, category, url: urlData.publicUrl
  }]);
  if (dbErr) { alert('Failed to save document record: ' + dbErr.message); return false; }
  return true;
}

function populateBidDropdown() {
  const sel = document.getElementById('bid-doc-target');
  if (!sel) return;
  sel.innerHTML = '<option value="">— choose bid —</option>' +
    bids.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
}

function populateContactDropdown() {
  const sel = document.getElementById('crm-doc-target');
  if (!sel) return;
  sel.innerHTML = '<option value="">— choose contact —</option>' +
    contacts.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

async function uploadBidDoc() {
  const recordId = document.getElementById('bid-doc-target').value;
  const category = document.getElementById('bid-doc-cat').value;
  const fileInput = document.getElementById('bid-doc-file');
  if (!recordId) { alert('Please select a bid first.'); return; }
  if (!fileInput.files.length) { alert('Please select a file.'); return; }
  const files = Array.from(fileInput.files);
  let successCount = 0;
  for (const file of files) {
    const ok = await uploadDoc(file, category, recordId, 'bid');
    if (ok) successCount++;
  }
  fileInput.value = '';
  updateFileLabel('bid-doc-file', 'bid-file-label');
  if (successCount > 0) {
    alert(successCount + ' document(s) uploaded successfully!');
    await loadBidDocs(recordId);
  }
}

async function uploadCRMDoc() {
  const recordId = document.getElementById('crm-doc-target').value;
  const category = document.getElementById('crm-doc-cat').value;
  const fileInput = document.getElementById('crm-doc-file');
  if (!recordId) { alert('Please select a contact first.'); return; }
  if (!fileInput.files.length) { alert('Please select a file.'); return; }
  const files = Array.from(fileInput.files);
  let successCount = 0;
  for (const file of files) {
    const ok = await uploadDoc(file, category, recordId, 'crm');
    if (ok) successCount++;
  }
  fileInput.value = '';
  updateFileLabel('crm-doc-file', 'crm-file-label');
  if (successCount > 0) {
    alert(successCount + ' document(s) uploaded successfully!');
    await loadCRMDocs(recordId);
  }
}

function updateFileLabel(inputId, labelId) {
  const input = document.getElementById(inputId);
  const label = document.getElementById(labelId);
  if (!label) return;
  if (input.files.length === 0) {
    label.textContent = '📂 Choose files';
  } else if (input.files.length === 1) {
    label.textContent = '📄 ' + input.files[0].name;
  } else {
    label.textContent = '📄 ' + input.files.length + ' files selected';
  }
}

async function loadBidDocs(recordId) {
  const { data } = await supabase.from('documents').select('*').eq('record_id', recordId).eq('record_type', 'bid');
  const el = document.getElementById('bid-doc-list');
  if (el) el.innerHTML = renderDocsHTML(data || []);
}

async function loadCRMDocs(recordId) {
  const { data } = await supabase.from('documents').select('*').eq('record_id', recordId).eq('record_type', 'crm');
  const el = document.getElementById('crm-doc-list');
  if (el) el.innerHTML = renderDocsHTML(data || []);
}

// ── Bid modal ─────────────────────────────────────────────────────────
async function openBidModal(id) {
  const b = bids.find(x => x.id === id);
  if (!b) return;
  document.getElementById('bm-name').textContent = b.name;
  document.getElementById('bm-sub').textContent = b.client + ' · ' + b.status;
  const dec = b.score >= 60 ? '<span class="badge bgo">GO</span>' : b.score > 0 ? '<span class="badge bnogo">No-Go</span>' : '—';
  document.getElementById('bm-rows').innerHTML = `
    <div class="mrow"><div class="mlbl">Client</div><div class="mval">${b.client||'—'}</div></div>
    <div class="mrow"><div class="mlbl">Est. Value</div><div class="mval">${b.value!=null?'R '+Number(b.value).toLocaleString():'—'}</div></div>
    <div class="mrow"><div class="mlbl">Deadline</div><div class="mval">${b.deadline||'—'}</div></div>
    <div class="mrow"><div class="mlbl">Score</div><div class="mval">${b.score}/100</div></div>
    <div class="mrow"><div class="mlbl">Decision</div><div class="mval">${dec}</div></div>
    <div class="mrow"><div class="mlbl">Status</div><div class="mval"><span class="badge bb">${b.status}</span></div></div>
    <div class="mrow"><div class="mlbl">Created</div><div class="mval">${b.created_at?new Date(b.created_at).toLocaleDateString():'—'}</div></div>`;
  document.getElementById('bm-docs').innerHTML = '<div style="color:var(--faint);font-size:13px">Loading...</div>';
  document.getElementById('bid-modal').classList.add('open');
  const { data } = await supabase.from('documents').select('*').eq('record_id', id).eq('record_type', 'bid');
  document.getElementById('bm-docs').innerHTML = renderDocsHTML(data || []);
}

// ── Contact modal ─────────────────────────────────────────────────────
async function openContactModal(id) {
  const c = contacts.find(x => x.id === id);
  if (!c) return;
  const stageClass = c.stage==='Active Client'?'bgo':c.stage==='Lead'?'bb':c.stage==='Prospect'?'ba':'bnogo';
  document.getElementById('cm-name').textContent = c.name;
  document.getElementById('cm-sub').textContent = c.role + ' · ' + c.company;
  document.getElementById('cm-rows').innerHTML = `
    <div class="mrow"><div class="mlbl">Company</div><div class="mval">${c.company||'—'}</div></div>
    <div class="mrow"><div class="mlbl">Role</div><div class="mval">${c.role||'—'}</div></div>
    <div class="mrow"><div class="mlbl">Phone</div><div class="mval">${c.phone||'—'}</div></div>
    <div class="mrow"><div class="mlbl">Email</div><div class="mval">${c.email||'—'}</div></div>
    <div class="mrow"><div class="mlbl">Stage</div><div class="mval"><span class="badge ${stageClass}">${c.stage}</span></div></div>
    <div class="mrow"><div class="mlbl">Opp. Value</div><div class="mval">${c.opportunity_value?'R '+Number(c.opportunity_value).toLocaleString():'—'}</div></div>
    <div class="mrow"><div class="mlbl">Follow-up</div><div class="mval">${c.followup_date||'—'}</div></div>
    <div class="mrow"><div class="mlbl">Notes</div><div class="mval" style="white-space:pre-wrap">${c.notes||'—'}</div></div>
    <div class="mrow"><div class="mlbl">Added</div><div class="mval">${c.created_at?new Date(c.created_at).toLocaleDateString():'—'}</div></div>`;
  document.getElementById('cm-docs').innerHTML = '<div style="color:var(--faint);font-size:13px">Loading...</div>';
  document.getElementById('crm-modal').classList.add('open');
  const { data } = await supabase.from('documents').select('*').eq('record_id', id).eq('record_type', 'crm');
  document.getElementById('cm-docs').innerHTML = renderDocsHTML(data || []);
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.querySelectorAll('.modal-bg').forEach(m => m.classList.remove('open'));
});

window.addBid = addBid;
window.deleteBid = deleteBid;
window.loadBids = loadBids;
window.clearBidForm = clearBidForm;
window.renderBids = renderBids;
window.toggleLib = toggleLib;
window.updateLib = updateLib;
window.setRAG = setRAG;
window.addProject = addProject;
window.addCE = addCE;
window.addBlocker = addBlocker;
window.calcNet = calcNet;
window.calcRet = calcRet;
window.markPaid = markPaid;
window.addDebtor = addDebtor;
window.updateFri = updateFri;
window.saveDecision = saveDecision;
window.renderDecisions = renderDecisions;
window.switchTab = switchTab;
window.addContact = addContact;
window.deleteContact = deleteContact;
window.clearCRMForm = clearCRMForm;
window.openBidModal = openBidModal;
window.openContactModal = openContactModal;
window.closeModal = closeModal;
window.uploadBidDoc = uploadBidDoc;
window.uploadCRMDoc = uploadCRMDoc;
window.updateFileLabel = updateFileLabel;