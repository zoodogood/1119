import PartnersDaemon from './PartnersDaemon.js'

export const daemon_singleton = ( new PartnersDaemon )
daemon_singleton.checkTimeEvent()
