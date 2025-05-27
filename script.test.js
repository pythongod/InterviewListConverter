// Mock window.matchMedia for Jest environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Require the module normally
const scriptModule = require('./script');
const { capitalize, convertEmailList } = scriptModule;

// Mock alert
global.alert = jest.fn();

describe('capitalize', () => {
  test('should return an empty string for an empty input', () => {
    expect(capitalize('')).toBe('');
  });
  test('should capitalize a single lowercase word', () => {
    expect(capitalize('word')).toBe('Word');
  });
  test('should capitalize a single uppercase word and convert rest to lowercase', () => {
    expect(capitalize('WORD')).toBe('Word');
  });
  test('should capitalize a single mixed-case word and convert rest to lowercase', () => {
    expect(capitalize('wOrD')).toBe('Word');
  });
  test('should capitalize each word in a sentence', () => {
    expect(capitalize('hello world from test')).toBe('Hello World From Test');
  });
  test('should handle words separated by dots', () => {
    expect(capitalize('john.doe')).toBe('John Doe');
  });
  test('should handle words separated by dots with surrounding spaces', () => {
    expect(capitalize('  john.doe  ')).toBe('John Doe');
  });
  test('should handle words separated by underscores', () => {
    expect(capitalize('john_doe')).toBe('John Doe');
  });
  test('should handle words separated by underscores with surrounding spaces', () => {
    expect(capitalize('  john_doe  ')).toBe('John Doe');
  });
  test('should handle leading and trailing spaces', () => {
    expect(capitalize('  hello world  ')).toBe('Hello World');
  });
  test('should handle multiple spaces between words', () => {
    expect(capitalize('hello   world')).toBe('Hello World');
  });
  test('should correctly capitalize names with internal spaces like "Mary Anne"', () => {
    expect(capitalize('mary anne smith')).toBe('Mary Anne Smith');
  });
  test('should correctly capitalize "MARY ANNE SMITH"', () => {
    expect(capitalize('MARY ANNE SMITH')).toBe('Mary Anne Smith');
  });
  test('should correctly capitalize "mArY aNNe sMiTh"', () => {
    expect(capitalize('mArY aNNe sMiTh')).toBe('Mary Anne Smith');
  });
  test('should handle names with dots and mixed casing like "jOhN.dOe"', () => {
    expect(capitalize('jOhN.dOe')).toBe('John Doe');
  });
  test('should handle names with underscores and mixed casing like "jAnE_dOe"', () => {
    expect(capitalize('jAnE_dOe')).toBe('Jane Doe');
  });
  test('should handle single letter words', () => {
    expect(capitalize('a b c')).toBe('A B C');
  });
  test('should handle words with numbers (numbers should remain as is)', () => {
    expect(capitalize('test1 test2')).toBe('Test1 Test2');
  });
  test('should handle string with only spaces', () => {
    expect(capitalize('   ')).toBe('');
  });
  test('should handle string with dots and spaces', () => {
    expect(capitalize(' . ')).toBe('');
  });
  test('should handle string with underscores and spaces', () => {
    expect(capitalize(' _ ')).toBe('');
  });
});

describe('convertEmailList', () => {
  let mockDisplayNamesSpy;
  let mockGetElementByIdSpy;

  beforeEach(() => {
    // Spy on scriptModule.displayNames (which is now called via module.exports.displayNames)
    mockDisplayNamesSpy = jest.spyOn(scriptModule, 'displayNames').mockImplementation(() => {});
    // Spy on document.getElementById
    mockGetElementByIdSpy = jest.spyOn(document, 'getElementById');
    
    // Clear alert mock calls before each test
    global.alert.mockClear();
  });

  afterEach(() => {
    // Restore the original implementations after each test
    mockDisplayNamesSpy.mockRestore();
    mockGetElementByIdSpy.mockRestore();
  });

  // Helper function to sort arrays for comparison
  const sorted = (arr) => [...arr].sort();

  test('should process mixed input: "User Name" <user.name@example.com>; another.user@example.net', () => {
    mockGetElementByIdSpy.mockReturnValueOnce({ value: '"User Name" <user.name@example.com>; another.user@example.net' });
    convertEmailList();
    expect(mockDisplayNamesSpy).toHaveBeenCalledTimes(1);
    expect(sorted(mockDisplayNamesSpy.mock.calls[0][0])).toEqual(sorted(["User Name", "Another User"]));
  });

  test('should process single email: test@example.com', () => {
    mockGetElementByIdSpy.mockReturnValueOnce({ value: 'test@example.com' });
    convertEmailList();
    expect(mockDisplayNamesSpy).toHaveBeenCalledWith(['Test']); // Updated expectation
  });

  test('should process "Doe, John" <john.doe@example.com>', () => {
    mockGetElementByIdSpy.mockReturnValueOnce({ value: '"Doe, John" <john.doe@example.com>' });
    convertEmailList();
    expect(mockDisplayNamesSpy).toHaveBeenCalledWith(['John Doe']);
  });

  test('should process: plainname, "Another, Person" <ap@example.com>, last@example.org', () => {
    mockGetElementByIdSpy.mockReturnValueOnce({ value: 'plainname, "Another, Person" <ap@example.com>, last@example.org' });
    convertEmailList();
    expect(mockDisplayNamesSpy).toHaveBeenCalledTimes(1);
    const expected = ["Plainname", "Person Another", "Last Example"];
    expect(sorted(mockDisplayNamesSpy.mock.calls[0][0])).toEqual(sorted(expected));
    expect(mockDisplayNamesSpy.mock.calls[0][0].length).toBe(expected.length);
  });

  test('should process malformed input: malformed; "Only Name", <justemail@example.com>', () => {
    mockGetElementByIdSpy.mockReturnValueOnce({ value: 'malformed; "Only Name", <justemail@example.com>' });
    convertEmailList();
    expect(mockDisplayNamesSpy).toHaveBeenCalledTimes(1);
    const expected = ["Only Name", "Justemail"]; // Updated expectation for justemail
    const actual = sorted(mockDisplayNamesSpy.mock.calls[0][0]);
    expect(actual).toEqual(sorted(expected));
    expect(actual).not.toContain("Malformed"); 
    expect(actual.length).toBe(expected.length);
  });

  test('should handle empty input string', () => {
    mockGetElementByIdSpy.mockReturnValueOnce({ value: '' });
    convertEmailList();
    expect(global.alert).toHaveBeenCalledWith("Email list input is empty.");
    expect(mockDisplayNamesSpy).toHaveBeenCalledWith([]);
  });
  
  test('should handle input with only spaces', () => {
    mockGetElementByIdSpy.mockReturnValueOnce({ value: '   ' });
    convertEmailList();
    expect(global.alert).toHaveBeenCalledWith("Email list input is empty.");
    expect(mockDisplayNamesSpy).toHaveBeenCalledWith([]);
  });

  test('should process input with mixed separators: name1@domain.com, "Name, Two" <n2@d.co>; name3@d.com\\n"Four, Name" <n4@d.com>', () => {
    mockGetElementByIdSpy.mockReturnValueOnce({ value: 'name1@domain.com, "Name, Two" <n2@d.co>; name3@d.com\n"Four, Name" <n4@d.com>' });
    convertEmailList();
    // Based on new rules: name1@domain.com -> Name1, name3@d.com -> Name3
    // "Name, Two" <n2@d.co> -> Two Name (name part from email regex)
    // "Four, Name" <n4@d.com> -> Name Four (name part from email regex)
    const expectedNames = ["Name1", "Two Name", "Name3", "Name Four"];
    expect(mockDisplayNamesSpy).toHaveBeenCalledTimes(1);
    expect(sorted(mockDisplayNamesSpy.mock.calls[0][0])).toEqual(sorted(expectedNames));
    expect(mockDisplayNamesSpy.mock.calls[0][0].length).toBe(expectedNames.length);
  });
});
