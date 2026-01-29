import Foundation

extension Date {
    /// Returns a human-readable relative string like "2 days ago", "3 weeks ago", etc.
    func relativeString() -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .full
        return formatter.localizedString(for: self, relativeTo: Date())
    }

    /// Returns the number of days from now (positive = future, negative = past).
    func daysFromNow() -> Int {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.day], from: calendar.startOfDay(for: Date()), to: calendar.startOfDay(for: self))
        return components.day ?? 0
    }

    /// Returns a short formatted date string like "Jan 15, 2024".
    func shortFormatted() -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter.string(from: self)
    }
}
