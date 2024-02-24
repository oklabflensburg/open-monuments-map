import { Env } from './env.js'

const env = new Env()


env.injectLinkContent('.contact-mail', 'mailto:', '', env.contactMail, env.contactMail)
env.injectLinkContent('.contact-phone', 'tel:', '', env.contactPhone, env.contactPhone)

env.injectLinkContent('.matomo-disagree', '', '/index.php?module=CoreAdminHome&action=optOut&language=de', env.origin, 'Hakens')
env.injectLinkContent('.website-origin', '', '', '', env.origin)

env.injectTextContent('.privacy-contact-person', env.privacyContactPerson)
env.injectTextContent('.address-name', env.addressName)
env.injectTextContent('.address-street', env.addressStreet)
env.injectTextContent('.address-house-number', env.addressHouseNumber)
env.injectTextContent('.address-postal-code', env.addressPostalCode)
env.injectTextContent('.address-city', env.addressCity)