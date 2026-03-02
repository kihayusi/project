import{c as y,g as D,R as r,h as I,j as m,H as M,r as E}from"./index-Bts0sOli.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=y("Shield",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const P=y("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]);function b(l){const i=l+"CollectionProvider",[h,v]=D(i),[A,d]=h(i,{collectionRef:{current:null},itemMap:new Map}),p=c=>{const{scope:e,children:s}=c,t=r.useRef(null),o=r.useRef(new Map).current;return m.jsx(A,{scope:e,itemMap:o,collectionRef:t,children:s})};p.displayName=i;const u=l+"CollectionSlot",N=M(u),C=r.forwardRef((c,e)=>{const{scope:s,children:t}=c,o=d(u,s),n=I(e,o.collectionRef);return m.jsx(N,{ref:n,children:t})});C.displayName=u;const f=l+"CollectionItemSlot",x="data-radix-collection-item",T=M(f),R=r.forwardRef((c,e)=>{const{scope:s,children:t,...o}=c,n=r.useRef(null),S=I(e,n),a=d(f,s);return r.useEffect(()=>(a.itemMap.set(n,{ref:n,...o}),()=>void a.itemMap.delete(n))),m.jsx(T,{[x]:"",ref:S,children:t})});R.displayName=f;function O(c){const e=d(l+"CollectionConsumer",c);return r.useCallback(()=>{const t=e.collectionRef.current;if(!t)return[];const o=Array.from(t.querySelectorAll(`[${x}]`));return Array.from(e.itemMap.values()).sort((a,_)=>o.indexOf(a.ref.current)-o.indexOf(_.ref.current))},[e.collectionRef,e.itemMap])}return[{Provider:p,Slot:C,ItemSlot:R},O,v]}var j=E.createContext(void 0);function g(l){const i=E.useContext(j);return l||i||"ltr"}export{L as S,P as X,b as c,g as u};
