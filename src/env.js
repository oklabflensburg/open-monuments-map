export class Env {
  constructor() {
    this.origin = process.env.BASE_URL
    this.contactMail = process.env.CONTACT_MAIL
    this.contactPhone = process.env.CONTACT_PHONE
    this.privacyContactPerson = process.env.PRIVACY_CONTACT_PERSON
    this.addressName = process.env.ADDRESS_NAME
    this.addressStreet = process.env.ADDRESS_STREET
    this.addressHouseNumber = process.env.ADDRESS_HOUSE_NUMBER
    this.addressPostalCode = process.env.ADDRESS_POSTAL_CODE
    this.addressCity = process.env.ADDRESS_CITY
  }

  injectLinkContent(className, prepend, append, link, value) {
    const nodes = document.querySelectorAll(className)

    nodes.forEach((node) => {
      node.href = `${prepend}${link}${append}`
      node.innerHTML = value
    })
  }


  injectTextContent(className, value) {
    const nodes = document.querySelectorAll(className)

    nodes.forEach((node) => {
      node.innerText = value
    })
  }
}