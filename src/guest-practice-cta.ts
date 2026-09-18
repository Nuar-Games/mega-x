import { getSavedSession } from './onlineAuth'

const SIGN_IN_ID='mx-main-sign-in'
const PRACTICE_CTA_ID='mx-main-practice-cta'

function isSignedIn(){
  const session=getSavedSession()
  return Boolean(session?.accessToken&&session.accessToken!=='practice-local')
}

function mountGuestFirstLanding(){
  const landing=document.querySelector<HTMLElement>('#mx-main-landing .mx-main-portrait')
  if(!landing)return

  const mainCta=landing.querySelector<HTMLButtonElement>('.mx-main-cta')
  if(mainCta){
    mainCta.id=PRACTICE_CTA_ID
  }
  if(mainCta&&!mainCta.dataset.guestFirstBound){
    mainCta.dataset.guestFirstBound='1'
    mainCta.addEventListener('click',(event)=>{
      if(isSignedIn())return
      event.preventDefault()
      event.stopImmediatePropagation()
      console.log('[MX_QA] guest-practice-cta dispatch enter-guest-lobby')
      window.dispatchEvent(new CustomEvent('mega-x:enter-guest-lobby'))
    },true)
  }

  if(isSignedIn()){
    document.getElementById(SIGN_IN_ID)?.remove()
    return
  }
  if(document.getElementById(SIGN_IN_ID))return

  const signIn=document.createElement('button')
  signIn.id=SIGN_IN_ID
  signIn.type='button'
  signIn.textContent='SIGN IN'
  signIn.setAttribute('aria-label','Sign in to earn leaderboard points')
  Object.assign(signIn.style,{
    position:'absolute',
    zIndex:'13',
    right:'5%',
    top:'2.5%',
    padding:'8px 12px',
    border:'1px solid rgba(255,255,255,.28)',
    borderRadius:'999px',
    background:'rgba(4,7,18,.72)',
    color:'#fff',
    font:'800 12px/1 Inter,system-ui,sans-serif',
    letterSpacing:'.08em',
    cursor:'pointer',
    pointerEvents:'auto',
  })
  signIn.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('mega-x:open-sign-in')))
  landing.appendChild(signIn)
}

mountGuestFirstLanding()
const observer=new MutationObserver(mountGuestFirstLanding)
observer.observe(document.documentElement,{subtree:true,childList:true})
