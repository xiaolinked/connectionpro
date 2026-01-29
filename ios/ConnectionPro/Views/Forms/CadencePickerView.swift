import SwiftUI

enum CadenceOption: String, CaseIterable {
    case none = "None"
    case monthly = "Monthly"
    case quarterly = "Quarterly"
    case custom = "Custom"

    var days: Int {
        switch self {
        case .none: return 0
        case .monthly: return 30
        case .quarterly: return 90
        case .custom: return 0
        }
    }

    static func from(days: Int) -> CadenceOption {
        switch days {
        case 0: return .none
        case 30: return .monthly
        case 90: return .quarterly
        default: return .custom
        }
    }
}

struct CadencePickerView: View {
    @Binding var frequency: Int
    @State private var selectedOption: CadenceOption
    @State private var customDays: String

    init(frequency: Binding<Int>) {
        _frequency = frequency
        let option = CadenceOption.from(days: frequency.wrappedValue)
        _selectedOption = State(initialValue: option)
        _customDays = State(initialValue: option == .custom ? "\(frequency.wrappedValue)" : "")
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Follow-up Frequency")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Picker("Frequency", selection: $selectedOption) {
                ForEach(CadenceOption.allCases, id: \.self) { option in
                    Text(option.rawValue).tag(option)
                }
            }
            .pickerStyle(.segmented)
            .onChange(of: selectedOption) { _, newValue in
                if newValue != .custom {
                    frequency = newValue.days
                }
            }

            if selectedOption == .custom {
                HStack {
                    TextField("Days", text: $customDays)
                        .textFieldStyle(.roundedBorder)
                        .keyboardType(.numberPad)
                        .frame(width: 80)
                        .onChange(of: customDays) { _, newValue in
                            if let days = Int(newValue), days > 0 {
                                frequency = days
                            }
                        }

                    Text("days between follow-ups")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }
}

#Preview {
    VStack(spacing: 40) {
        CadencePickerView(frequency: .constant(0))
        CadencePickerView(frequency: .constant(30))
        CadencePickerView(frequency: .constant(45))
    }
    .padding()
}
