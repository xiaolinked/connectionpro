import SwiftUI

/// Mode for the contact picker
enum ContactPickerMode {
    /// Tap a single contact to select it (used for form pre-fill)
    case single
    /// Multi-select contacts with checkboxes + Import All option
    case bulkImport
}

/// A searchable view that displays contacts from the device phonebook.
/// Supports single-select (for form pre-fill) and bulk import modes.
struct ContactPickerView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var contactsService = ContactsService.shared
    @State private var searchText = ""
    @State private var selectedContactIds: Set<String> = []
    @State private var isImporting = false
    @State private var importProgress = 0
    @State private var importError: String?
    @State private var importSuccess = false

    let mode: ContactPickerMode

    /// Callback when a single contact is selected (single mode)
    var onSelect: ((PhonebookContact) -> Void)?

    /// Callback when multiple contacts are imported (bulk mode).
    /// Called with the array of contacts that were selected.
    var onBulkImport: (([PhonebookContact]) -> Void)?

    /// Convenience init for single-select mode (backwards compatible)
    init(onSelect: @escaping (PhonebookContact) -> Void) {
        self.mode = .single
        self.onSelect = onSelect
        self.onBulkImport = nil
    }

    /// Init for bulk import mode
    init(onBulkImport: @escaping ([PhonebookContact]) -> Void) {
        self.mode = .bulkImport
        self.onSelect = nil
        self.onBulkImport = onBulkImport
    }

    private var filteredContacts: [PhonebookContact] {
        if searchText.isEmpty {
            return contactsService.contacts
        }
        let query = searchText.lowercased()
        return contactsService.contacts.filter { $0.searchableText.contains(query) }
    }

    private var allFilteredSelected: Bool {
        !filteredContacts.isEmpty && filteredContacts.allSatisfy { selectedContactIds.contains($0.id) }
    }

    var body: some View {
        NavigationStack {
            Group {
                if contactsService.isLoading {
                    LoadingView(message: "Loading contacts...")
                } else if let error = contactsService.errorMessage {
                    EmptyStateView(
                        systemImage: "person.crop.circle.badge.exclamationmark",
                        title: "Cannot Access Contacts",
                        message: error,
                        actionTitle: "Open Settings"
                    ) {
                        if let url = URL(string: UIApplication.openSettingsURLString) {
                            UIApplication.shared.open(url)
                        }
                    }
                } else if contactsService.contacts.isEmpty {
                    EmptyStateView(
                        systemImage: "person.2.slash",
                        title: "No Contacts",
                        message: "Your phonebook is empty."
                    )
                } else if importSuccess {
                    importSuccessView
                } else {
                    contactListView
                }
            }
            .navigationTitle(mode == .single ? "Import Contact" : "Import Contacts")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(importSuccess ? "Done" : "Cancel") {
                        dismiss()
                    }
                    .disabled(isImporting)
                }

                if mode == .bulkImport && !contactsService.contacts.isEmpty && !importSuccess {
                    ToolbarItem(placement: .primaryAction) {
                        Button {
                            importAllContacts()
                        } label: {
                            Text("Import All")
                        }
                        .disabled(isImporting)
                    }
                }
            }
            .task {
                await contactsService.fetchContacts()
            }
        }
    }

    // MARK: - Contact List

    @ViewBuilder
    private var contactListView: some View {
        VStack(spacing: 0) {
            List {
                if mode == .bulkImport {
                    // Select/Deselect all toggle for current filter
                    Section {
                        Button {
                            toggleSelectAll()
                        } label: {
                            HStack {
                                Image(systemName: allFilteredSelected ? "checkmark.circle.fill" : "circle")
                                    .foregroundStyle(allFilteredSelected ? Color.appPrimary : .secondary)
                                    .font(.title3)
                                Text(allFilteredSelected ? "Deselect All" : "Select All")
                                    .foregroundStyle(.primary)
                                Spacer()
                                Text("\(selectedContactIds.count) selected")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }

                Section {
                    ForEach(filteredContacts) { contact in
                        contactRowButton(for: contact)
                    }
                }
            }
            .listStyle(.plain)
            .searchable(text: $searchText, prompt: "Search contacts...")
            .disabled(isImporting)

            // Bottom bar for bulk import
            if mode == .bulkImport {
                importBottomBar
            }
        }
    }

    @ViewBuilder
    private func contactRowButton(for contact: PhonebookContact) -> some View {
        switch mode {
        case .single:
            Button {
                onSelect?(contact)
                dismiss()
            } label: {
                ContactRow(contact: contact, showCheckbox: false, isSelected: false)
            }
            .buttonStyle(.plain)

        case .bulkImport:
            Button {
                toggleSelection(contact)
            } label: {
                ContactRow(
                    contact: contact,
                    showCheckbox: true,
                    isSelected: selectedContactIds.contains(contact.id)
                )
            }
            .buttonStyle(.plain)
        }
    }

    // MARK: - Bottom Bar

    @ViewBuilder
    private var importBottomBar: some View {
        VStack(spacing: 0) {
            Divider()
            HStack(spacing: 16) {
                if isImporting {
                    ProgressView()
                    Text("Importing \(importProgress) of \(selectedContactIds.count)...")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                } else if let error = importError {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundStyle(.orange)
                    Text(error)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                } else {
                    Text("\(selectedContactIds.count) contact\(selectedContactIds.count == 1 ? "" : "s") selected")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Button {
                    importSelectedContacts()
                } label: {
                    Text("Import Selected")
                        .fontWeight(.semibold)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                }
                .buttonStyle(.borderedProminent)
                .tint(.appPrimary)
                .disabled(selectedContactIds.isEmpty || isImporting)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color.sectionBackground)
        }
    }

    // MARK: - Import Success

    @ViewBuilder
    private var importSuccessView: some View {
        VStack(spacing: 20) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 64))
                .foregroundStyle(.green)

            Text("Import Complete!")
                .font(.title2)
                .fontWeight(.bold)

            Text("\(importProgress) contact\(importProgress == 1 ? "" : "s") imported successfully.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }

    // MARK: - Actions

    private func toggleSelection(_ contact: PhonebookContact) {
        if selectedContactIds.contains(contact.id) {
            selectedContactIds.remove(contact.id)
        } else {
            selectedContactIds.insert(contact.id)
        }
    }

    private func toggleSelectAll() {
        if allFilteredSelected {
            for contact in filteredContacts {
                selectedContactIds.remove(contact.id)
            }
        } else {
            for contact in filteredContacts {
                selectedContactIds.insert(contact.id)
            }
        }
    }

    private func importAllContacts() {
        // Select all contacts, then import
        selectedContactIds = Set(contactsService.contacts.map(\.id))
        importSelectedContacts()
    }

    private func importSelectedContacts() {
        guard !selectedContactIds.isEmpty else { return }

        let contactsToImport = contactsService.contacts.filter { selectedContactIds.contains($0.id) }

        isImporting = true
        importProgress = 0
        importError = nil

        Task {
            var imported = 0
            for contact in contactsToImport {
                do {
                    let data = ConnectionCreate(
                        name: contact.name,
                        role: contact.jobTitle,
                        company: contact.company,
                        email: contact.email
                    )
                    _ = try await ConnectionService.create(data)
                    imported += 1
                    importProgress = imported
                } catch {
                    // Continue importing others even if one fails
                    continue
                }
            }

            isImporting = false
            importProgress = imported

            if imported > 0 {
                importSuccess = true
                onBulkImport?(contactsToImport)
            } else {
                importError = "Failed to import contacts. Please try again."
            }
        }
    }
}

// MARK: - Contact Row

private struct ContactRow: View {
    let contact: PhonebookContact
    let showCheckbox: Bool
    let isSelected: Bool

    var body: some View {
        HStack(spacing: 16) {
            if showCheckbox {
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(isSelected ? Color.appPrimary : .secondary)
                    .font(.title3)
            }

            // Avatar
            Circle()
                .fill(Color.brandGradient)
                .frame(width: 44, height: 44)
                .overlay(
                    Text(contact.name.prefix(1).uppercased())
                        .font(.headline)
                        .fontWeight(.semibold)
                        .foregroundStyle(.white)
                )

            VStack(alignment: .leading, spacing: 4) {
                Text(contact.name)
                    .font(.body)
                    .fontWeight(.medium)
                    .foregroundStyle(.primary)

                if let subtitle = contactSubtitle {
                    Text(subtitle)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }

            Spacer()

            if !showCheckbox {
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
        }
        .padding(.vertical, 6)
    }

    private var contactSubtitle: String? {
        if let jobTitle = contact.jobTitle, let company = contact.company {
            return "\(jobTitle) @ \(company)"
        }
        return contact.company ?? contact.jobTitle ?? contact.email
    }
}

#Preview("Single Select") {
    ContactPickerView { contact in
        print("Selected: \(contact.name)")
    }
}

#Preview("Bulk Import") {
    ContactPickerView { contacts in
        print("Imported: \(contacts.count) contacts")
    }
}
