import XCTest
import SwiftTreeSitter
import TreeSitterRpmspec

final class TreeSitterRpmspecTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_rpmspec())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading RPMSpec grammar")
    }
}
