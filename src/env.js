export class Env {
  constructor() {
    this.origin = process.env.PARCEL_BASE_URL
    this.contactMail = process.env.PARCEL_CONTACT_MAIL
    this.contactPhone = process.env.PARCEL_CONTACT_PHONE
    this.privacyContactPerson = process.env.PARCEL_PRIVACY_CONTACT_PERSON
    this.addressName = process.env.PARCEL_ADDRESS_NAME
    this.addressStreet = process.env.PARCEL_ADDRESS_STREET
    this.addressHouseNumber = process.env.PARCEL_ADDRESS_HOUSE_NUMBER
    this.addressPostalCode = process.env.PARCEL_ADDRESS_POSTAL_CODE
    this.addressCity = process.env.PARCEL_ADDRESS_CITY
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