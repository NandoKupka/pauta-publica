// The panel needs search metadata, current records and the latest history date,
// not every document and historic movement for every subject.
export function panelSnapshot(snapshot) {
  const pautas=Object.fromEntries(Object.entries(snapshot.pautas??{}).map(([id,p])=>{
    const d=p.details;
    return [id,{id:p.id,org:p.org,orgs:p.orgs,provider:p.provider,key:p.key,kind:p.kind,reference:p.reference,
      title:p.title,summary:p.summary,explanation:p.explanation,parentId:p.parentId,firstSeen:p.firstSeen,lastSeen:p.lastSeen,
      details:d?{at:d.at,quality:d.quality,title:d.title,summary:d.summary,explanation:d.explanation,question:d.question,
        keywords:d.keywords,themes:d.themes,status:d.status,statusAt:d.statusAt,history:d.history?.slice(0,1).map(h=>({date:h.date}))}:undefined}];
  }));
  return {version:snapshot.version,checkedAt:snapshot.checkedAt,jobs:snapshot.jobs,pautas};
}
