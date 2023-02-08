import { createBannerRender } from './banner'
import './style.css'

const elApp = document.querySelector<HTMLDivElement>('#app')!

createBannerRender(elApp)
