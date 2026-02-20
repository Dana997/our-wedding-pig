const CATEGORIES = [
  { id: "hall", name: "웨딩홀" },
  { id: "sde", name: "스드메+예복" },
  { id: "parents", name: "양가준비" },
  { id: "honeymoon", name: "신혼여행" },
  { id: "home", name: "우리집" },
];

const STORAGE_KEY = "our_wedding_site_v1";

function money(n){
  const v = Number(n || 0);
  if (!isFinite(v)) return "0";
  return v.toLocaleString("ko-KR");
}
function parseMoney(s){
  if (typeof s !== "string") s = String(s ?? "");
  const cleaned = s.replace(/[^\d]/g, "");
  return cleaned ? Number(cleaned) : 0;
}
function uid(){
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(2, 7);
}

function defaultState(){
  const state = {
    meta: { title: "우리 결혼 준비 아지트" },
    summaryMemo: "",
    categories: {}
  };
  for (const c of CATEGORIES){
    state.categories[c.id] = {
      finalVendorId: null,
      vendors: []
    };
  }
  return state;
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    // 간단한 마이그레이션/보정
    if (!parsed.categories) return defaultState();
    for (const c of CATEGORIES){
      if (!parsed.categories[c.id]){
        parsed.categories[c.id] = { finalVendorId: null, vendors: [] };
      }
    }
    if (typeof parsed.summaryMemo !== "string") parsed.summaryMemo = "";
    if (!parsed.meta) parsed.meta = { title: "우리 결혼 준비 아지트" };
    return parsed;
  }catch{
    return defaultState();
  }
}
function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

const $tabs = document.getElementById("tabs");
const $viewSummary = document.getElementById("view-summary");
const $viewCategory = document.getElementById("view-category");
const $catTitle = document.getElementById("catTitle");
const $vendorList = document.getElementById("vendorList");
const $btnAddVendor = document.getElementById("btnAddVendor");
const $siteTitle = document.getElementById("siteTitle");

const $kpiBudget = document.getElementById("kpiBudget");
const $kpiDeposit = document.getElementById("kpiDeposit");
const $kpiBalance = document.getElementById("kpiBalance");
const $kpiTotal = document.getElementById("kpiTotal");
const $finalList = document.getElementById("finalList");

const $summaryMemo = document.getElementById("summaryMemo");
const $btnSaveSummaryMemo = document.getElementById("btnSaveSummaryMemo");

const $btnExport = document.getElementById("btnExport");
const $importFile = document.getElementById("importFile");

const vendorTpl = document.getElementById("vendorCardTpl");

let active = { view: "summary", catId: null };

function setActiveView(view, catId=null){
  active = { view, catId };
  // toggle views
  if (view === "summary"){
    $viewSummary.classList.add("active");
    $viewCategory.classList.remove("active");
  }else{
    $viewSummary.classList.remove("active");
    $viewCategory.classList.add("active");
  }
  // toggle tabs
  [...$tabs.querySelectorAll(".tab")].forEach(btn=>{
    const isSummary = btn.dataset.view === "summary";
    const isCat = btn.dataset.catId && btn.dataset.catId === catId;
    btn.classList.toggle("active", (view==="summary" && isSummary) || (view==="category" && isCat));
  });

  render();
}

function buildTabs(){
  $tabs.innerHTML = "";

  const summaryBtn = document.createElement("button");
  summaryBtn.className = "tab";
  summaryBtn.textContent = "Summary";
  summaryBtn.dataset.view = "summary";
  summaryBtn.onclick = ()=> setActiveView("summary");
  $tabs.appendChild(summaryBtn);

  for (const c of CATEGORIES){
    const b = document.createElement("button");
    b.className = "tab";
    b.textContent = c.name;
    b.dataset.catId = c.id;
    b.onclick = ()=> setActiveView("category", c.id);
    $tabs.appendChild(b);
  }
}

function computeTotals(){
  let budget=0, deposit
