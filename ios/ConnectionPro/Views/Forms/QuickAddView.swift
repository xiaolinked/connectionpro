import SwiftUI

struct QuickAddView: View {
    @State private var viewModel = QuickAddViewModel()
    @State private var showingSuccess = false

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: "person.badge.plus")
                        .font(.system(size: 48))
                        .foregroundStyle(Color.appPrimary)

                    Text("Quick Add")
                        .font(.largeTitle)
                        .fontWeight(.bold)

                    Text("Quickly add a new connection with just a name")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(.top, 40)

                // Form
                VStack(spacing: 16) {
                    TextField("Name", text: $viewModel.name)
                        .font(.title2)
                        .textFieldStyle(.roundedBorder)
                        .textContentType(.name)

                    TextEditor(text: $viewModel.notes)
                        .frame(minHeight: 100)
                        .padding(8)
                        .background(Color(.systemGray6))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .overlay(
                            Group {
                                if viewModel.notes.isEmpty {
                                    Text("Notes (optional)")
                                        .foregroundStyle(.tertiary)
                                        .padding(.leading, 12)
                                        .padding(.top, 16)
                                }
                            },
                            alignment: .topLeading
                        )

                    Button {
                        Task {
                            if await viewModel.save() != nil {
                                showingSuccess = true
                                viewModel.reset()
                            }
                        }
                    } label: {
                        HStack {
                            if viewModel.isSaving {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Image(systemName: "plus.circle.fill")
                                Text("Add Connection")
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.appPrimary)
                    .disabled(!viewModel.isValid || viewModel.isSaving)

                    if let error = viewModel.errorMessage {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(.red)
                    }
                }
                .padding(.horizontal)

                // Link to full form
                NavigationLink {
                    NewConnectionView()
                } label: {
                    Text("Need more details? Use full form →")
                        .font(.subheadline)
                        .foregroundStyle(Color.appPrimary)
                }

                Spacer()
            }
        }
        .background(Color.sectionBackground)
        .navigationTitle("Add")
        .alert("Connection Added!", isPresented: $showingSuccess) {
            Button("OK") { }
        } message: {
            Text("Your new connection has been saved.")
        }
    }
}

#Preview {
    NavigationStack {
        QuickAddView()
    }
}
