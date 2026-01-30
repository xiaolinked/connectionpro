import Foundation

/// Lightweight struct for displaying phonebook contacts in the picker
struct PhonebookContact: Identifiable, Equatable {
    let id: String
    let name: String
    let email: String?
    let phone: String?
    let company: String?
    let jobTitle: String?
    
    /// Full display name for search
    var searchableText: String {
        [name, company, jobTitle, email].compactMap { $0 }.joined(separator: " ").lowercased()
    }
}
