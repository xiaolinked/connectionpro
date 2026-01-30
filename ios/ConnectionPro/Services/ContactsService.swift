import Foundation
import Contacts

/// Service for accessing the device's Contacts
@MainActor
final class ContactsService: ObservableObject {
    static let shared = ContactsService()

    @Published var authorizationStatus: CNAuthorizationStatus = .notDetermined
    @Published var contacts: [PhonebookContact] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let store = CNContactStore()

    private init() {
        authorizationStatus = CNContactStore.authorizationStatus(for: .contacts)
    }

    /// Request access to contacts
    func requestAccess() async -> Bool {
        do {
            let granted = try await store.requestAccess(for: .contacts)
            authorizationStatus = CNContactStore.authorizationStatus(for: .contacts)
            return granted
        } catch {
            errorMessage = "Failed to request contacts access: \(error.localizedDescription)"
            return false
        }
    }

    /// Fetch all contacts from the device
    func fetchContacts() async {
        isLoading = true
        errorMessage = nil

        // Check authorization first
        if authorizationStatus != .authorized {
            let granted = await requestAccess()
            if !granted {
                isLoading = false
                errorMessage = "Contacts access denied. Please enable in Settings."
                return
            }
        }

        // Run the blocking enumerate call on a background thread
        let store = self.store
        do {
            let fetchedContacts = try await Task.detached(priority: .userInitiated) {
                let keysToFetch: [CNKeyDescriptor] = [
                    CNContactGivenNameKey as CNKeyDescriptor,
                    CNContactFamilyNameKey as CNKeyDescriptor,
                    CNContactOrganizationNameKey as CNKeyDescriptor,
                    CNContactJobTitleKey as CNKeyDescriptor,
                    CNContactEmailAddressesKey as CNKeyDescriptor,
                    CNContactPhoneNumbersKey as CNKeyDescriptor,
                    CNContactIdentifierKey as CNKeyDescriptor
                ]

                let request = CNContactFetchRequest(keysToFetch: keysToFetch)
                request.sortOrder = .givenName

                var results: [PhonebookContact] = []

                try store.enumerateContacts(with: request) { contact, _ in
                    let fullName = [contact.givenName, contact.familyName]
                        .filter { !$0.isEmpty }
                        .joined(separator: " ")

                    guard !fullName.isEmpty else { return }

                    let email = contact.emailAddresses.first?.value as String?
                    let phone = contact.phoneNumbers.first?.value.stringValue
                    let company = contact.organizationName.isEmpty ? nil : contact.organizationName
                    let jobTitle = contact.jobTitle.isEmpty ? nil : contact.jobTitle

                    results.append(PhonebookContact(
                        id: contact.identifier,
                        name: fullName,
                        email: email,
                        phone: phone,
                        company: company,
                        jobTitle: jobTitle
                    ))
                }

                return results
            }.value

            contacts = fetchedContacts
            isLoading = false

        } catch {
            errorMessage = "Failed to fetch contacts: \(error.localizedDescription)"
            isLoading = false
        }
    }
}
