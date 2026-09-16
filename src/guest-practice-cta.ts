export {}

const BUTTON_ID='mx-main-practice-cta'

function mountGuestPracticeButton(){
  const landing=document.querySelector<HTMLElement>('#mx-main-landing .mx-main-portrait')
  if(!landing||document.getElementById(BUTTON_ID))return

  const button=document.createElement('button')
  button.id=BUTTON_ID
  button.type='button'
  button.textContent='PRACTICE — PLAY AS GUEST'
  button.setAttribute('aria-label','Play Practice as guest')
  Object.assign(button.style,{
    position:'absolute',
    zIndex:'12',
    left:'14%',
    top:'69.2%',
    width:'72%',
    minHeight:'42px',
    padding:'10px 14px',
    border:'1px solid rgba(255,255,255,.28)',
    borderRadius:'12px',
    background:'rgba(5,8,20,.88)',
    color:'#fff',
    font:'900 clamp(.72rem,2.1vw,.92rem)/1.1 Inter,system-ui,sans-serif',
    letterSpacing:'.08em',
    boxShadow:'0 0 16px rgba(87,157,255,.35), inset 0 0 14px rgba(128,72,255,.18)',
    cursor:'pointer',
    pointerEvents:'auto',
    touchAction:'manipulation',
    WebkitTapHighlightColor:'transparent',
  })
  button.addEventListener('click',()=>{
    window.dispatchEvent(new CustomEvent('mega-x:start-practice-match'))
  })
  landing.appendChild(button)
}

mountGuestPracticeButton()
const observer=new MutationObserver(mountGuestPracticeButton)
observer.observe(document.documentElement,{subtree:true,childList:true})
