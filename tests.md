# Test Cases Documentation

This document explains all the test cases defined in the InterviewListConverter test suite. The tests are organized into four main categories, each testing different functionality of the application.

## 1. `capitalize` Function Tests

The `capitalize` function is responsible for properly formatting names by capitalizing the first letter of each word and handling various separators.

### Basic Functionality Tests

- **Empty input**: Ensures the function returns an empty string when given an empty input
- **Single lowercase word**: Tests basic capitalization of a single word (`'word'` → `'Word'`)
- **Single uppercase word**: Tests that uppercase words are converted to proper case (`'WORD'` → `'Word'`)
- **Single mixed-case word**: Tests normalization of mixed case (`'wOrD'` → `'Word'`)

### Sentence and Multi-word Tests

- **Multiple words**: Tests capitalization of each word in a sentence (`'hello world from test'` → `'Hello World From Test'`)
- **Names with internal spaces**: Tests proper handling of names like "Mary Anne Smith"
- **ALL CAPS sentences**: Tests conversion from all caps to proper case
- **Mixed case sentences**: Tests normalization of randomly cased text

### Special Character Handling

- **Dot separators**: Tests conversion of dots to spaces (`'john.doe'` → `'John Doe'`)
- **Underscore separators**: Tests conversion of underscores to spaces (`'john_doe'` → `'John Doe'`)
- **Surrounding spaces**: Tests trimming of leading/trailing whitespace
- **Multiple spaces**: Tests normalization of multiple consecutive spaces

### Edge Cases

- **Single letter words**: Tests proper handling of single characters
- **Words with numbers**: Tests that numbers remain unchanged in alphanumeric strings
- **Only spaces**: Tests that strings containing only whitespace return empty
- **Only separators**: Tests that strings containing only dots or underscores return empty

## 2. `convertEmailList` Function Tests

The `convertEmailList` function parses various email list formats and extracts properly formatted names.

### Standard Email Formats

- **Mixed quoted/unquoted format**: Tests parsing of `"User Name" <user.name@example.com>; another.user@example.net`
  - Expected: `["User Name", "Another User"]`
  - This tests the ability to handle both quoted names with email addresses and plain email addresses

- **Single email**: Tests extraction from plain email address (`test@example.com` → `['Test']`)

- **Quoted lastname, firstname format**: Tests parsing of `"Doe, John" <john.doe@example.com>`
  - Expected: `['John Doe']`
  - This tests proper name flipping from lastname, firstname to firstname lastname

### Complex Parsing Scenarios

- **Mixed separators and formats**: Tests complex input with multiple format types
  - Input: `plainname, "Another, Person" <ap@example.com>, last@example.org`
  - Expected: `["Plainname", "Person Another", "Last Example"]`
  - This tests the parser's ability to handle different entry types in one input

- **Malformed input handling**: Tests graceful handling of invalid entries
  - Input: `malformed; "Only Name", <justemail@example.com>`
  - Expected: `["Only Name", "Justemail"]`
  - This ensures malformed entries are skipped while valid ones are processed

### Critical Bug Fix Tests (Added to address the user's issue)

- **Unquoted lastname, firstname email format**: Tests the specific format that was failing
  - Input: `Pitt, Brad Brad.Pitt@usd.de;`
  - Expected: `['Brad Pitt']`
  - **Why this test was crucial**: This format was being incorrectly split by commas, creating two separate entries instead of one properly formatted name

- **Multiple unquoted entries**: Tests the fix across multiple similar entries
  - Input: `Pitt, Brad Brad.Pitt@usd.de;Knowles, Beyoncé Beyonce.Knowles@usd.de;Johnson, Dwayne Dwayne.Johnson@usd.de;`
  - Expected: `['Brad Pitt', 'Beyoncé Knowles', 'Dwayne Johnson']`
  - This ensures the fix works consistently across multiple entries

### Input Validation Tests

- **Empty input**: Tests proper handling of empty strings with appropriate user feedback
- **Whitespace-only input**: Tests handling of strings containing only spaces

## 3. `filterAndDisplayDecline` Function Tests

These tests verify the TSV (Tab-Separated Values) filtering functionality for declined interview responses.

### Status Filtering Tests

- **"Abgesagt" status**: Tests filtering of entries with "Abgesagt" (cancelled) status
- **"Abgelehnt" status**: Tests filtering of entries with "Abgelehnt" (declined) status  
- **Combined statuses**: Tests that both "Abgesagt" and "Abgelehnt" entries are included in results

### Data Validation Tests

- **Empty results**: Tests behavior when no declined entries are found
- **Names without commas**: Tests handling of names already in "First Last" format
- **Empty rows**: Tests that empty or incomplete data rows are properly skipped
- **Missing status column**: Tests graceful handling of malformed TSV data

### Name Processing Tests

- **Name flipping**: Verifies that "Lastname, Firstname" entries are converted to "Firstname Lastname"
- **Data integrity**: Ensures only valid, complete entries are processed

## 4. `copyAllSorted` Function Tests

These tests verify the functionality that groups and sorts all TSV entries by status category, with counts displayed in each category header.

### Sorting and Grouping Tests

- **Multi-status sorting**: Tests proper categorization of entries into status groups with counts:
  - Zugesagt (2) (Confirmed)
  - Mit Vorbehalt (1) (With reservation) 
  - Abgelehnt (1) (Declined)
  - Keine (1) (No response)
  - Unbekannt (Unknown)

- **Alphabetical sorting**: Verifies that names within each category are sorted alphabetically

- **Name formatting**: Ensures "Lastname, Firstname" entries are properly flipped to "Firstname Lastname"

- **Count display**: Verifies that each category header shows the correct count of people in that category (e.g., "---- Zugesagt (2) ----")

### Edge Case Handling

- **Empty TSV data**: Tests that the function handles empty input gracefully without attempting to copy

## Test Coverage Summary

The test suite provides comprehensive coverage for:

1. **Input validation** - Handling empty, malformed, and edge case inputs
2. **Data parsing** - Correctly interpreting various email and name formats  
3. **Name processing** - Proper capitalization and format conversion
4. **Business logic** - Filtering, sorting, and categorizing data
5. **Error handling** - Graceful degradation when encountering invalid data

## Why These Tests Matter

The test suite was particularly crucial in identifying and fixing the bug reported by the user. The missing test case for unquoted "lastname, firstname email@domain" format revealed a parsing logic flaw that was incorrectly splitting entries by commas before recognizing the complete pattern. This demonstrates the importance of comprehensive test coverage for catching edge cases in real-world usage scenarios. 