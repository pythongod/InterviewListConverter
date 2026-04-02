const matchMediaListeners = [];
const matchMediaMock = {
  matches: false,
  media: '(prefers-color-scheme: dark)',
  onchange: null,
  addListener: jest.fn((listener) => {
    matchMediaListeners.push(listener);
  }),
  removeListener: jest.fn(),
  addEventListener: jest.fn((eventName, listener) => {
    if (eventName === 'change') {
      matchMediaListeners.push(listener);
    }
  }),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn((event) => {
    if (typeof event.matches === 'boolean') {
      matchMediaMock.matches = event.matches;
    }

    matchMediaListeners.forEach((listener) => listener(event));
    return true;
  }),
};

// Mock window.matchMedia for Jest environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(() => matchMediaMock),
});

// Require the module normally
const scriptModule = require('./script');
const {
  applyThemePreference,
  capitalize,
  convertEmailList,
  copyAllSorted,
  displayNames,
  extractAttendeeNamesFromMeetings,
  filterAndDisplayDecline,
  getStoredThemePreference,
  handleSystemThemeChange,
  normalizeMicrosoftAttendeeName,
  persistThemePreference,
} = scriptModule;

// Mock alert
global.alert = jest.fn();

// Mock navigator.clipboard properly
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: jest.fn(() => Promise.resolve())
  }
});

describe('theme preference', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.themePreference;
    document.documentElement.classList.remove('dark');
    matchMediaMock.matches = false;
  });

  test('should default to system preference when no override is stored', () => {
    applyThemePreference();
    expect(getStoredThemePreference()).toBe('system');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    matchMediaMock.matches = true;
    handleSystemThemeChange();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.dataset.themePreference).toBe('system');
  });

  test('should not override explicit light/dark choices when system preference changes', () => {
    persistThemePreference('dark');
    applyThemePreference('dark');

    expect(document.documentElement.classList.contains('dark')).toBe(true);

    matchMediaMock.matches = false;
    handleSystemThemeChange();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(getStoredThemePreference()).toBe('dark');
  });
});

describe('Microsoft 365 attendee extraction', () => {
  test('should normalize display names and skip resource attendees', () => {
    expect(normalizeMicrosoftAttendeeName({
      type: 'required',
      emailAddress: { name: 'Doe, Jane', address: 'jane.doe@example.com' }
    })).toBe('Jane Doe');

    expect(normalizeMicrosoftAttendeeName({
      type: 'resource',
      emailAddress: { name: 'Conference Room', address: 'room@example.com' }
    })).toBeNull();
  });

  test('should fall back to the email local-part when no attendee name exists', () => {
    expect(normalizeMicrosoftAttendeeName({
      type: 'optional',
      emailAddress: { address: 'john.smith@example.com' }
    })).toBe('John Smith');
  });

  test('should deduplicate attendee names across multiple selected meetings', () => {
    const names = extractAttendeeNamesFromMeetings([
      {
        attendees: [
          { type: 'required', emailAddress: { name: 'Doe, Jane', address: 'jane.doe@example.com' } },
          { type: 'optional', emailAddress: { address: 'john.smith@example.com' } }
        ]
      },
      {
        attendees: [
          { type: 'required', emailAddress: { name: 'Jane Doe', address: 'jane.doe@example.com' } },
          { type: 'resource', emailAddress: { name: 'Room 1', address: 'room1@example.com' } }
        ]
      }
    ]);

    expect(names).toEqual(['Jane Doe', 'John Smith']);
  });
});

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

  test('should process unquoted display name email format: John Doe <john.doe@example.com>', () => {
    mockGetElementByIdSpy.mockReturnValueOnce({ value: 'John Doe <john.doe@example.com>' });
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

  test('should process unquoted lastname, firstname email format: Pitt, Brad Brad.Pitt@usd.de;', () => {
    mockGetElementByIdSpy.mockReturnValueOnce({ value: 'Pitt, Brad Brad.Pitt@usd.de;' });
    convertEmailList();
    expect(mockDisplayNamesSpy).toHaveBeenCalledTimes(1);
    expect(mockDisplayNamesSpy.mock.calls[0][0]).toEqual(['Brad Pitt']);
  });

  test('should process multiple unquoted lastname, firstname email entries', () => {
    mockGetElementByIdSpy.mockReturnValueOnce({ value: 'Pitt, Brad Brad.Pitt@usd.de;Knowles, Beyoncé Beyonce.Knowles@usd.de;Johnson, Dwayne Dwayne.Johnson@usd.de;' });
    convertEmailList();
    expect(mockDisplayNamesSpy).toHaveBeenCalledTimes(1);
    const expected = ['Brad Pitt', 'Beyoncé Knowles', 'Dwayne Johnson'];
    expect(sorted(mockDisplayNamesSpy.mock.calls[0][0])).toEqual(sorted(expected));
  });
});

describe('displayNames', () => {
  let querySelectorSpy;

  beforeEach(() => {
    document.body.innerHTML = '<ul id="resultList"></ul>';
    querySelectorSpy = jest.spyOn(document, 'querySelector').mockReturnValue({
      textContent: 'Interview List',
      scrollIntoView: jest.fn()
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    querySelectorSpy.mockRestore();
  });

  test('should escape user-provided HTML instead of injecting DOM nodes', () => {
    displayNames(['<img src=x onerror=alert(1)>']);

    const resultList = document.getElementById('resultList');
    expect(resultList.querySelector('img')).toBeNull();
    expect(resultList.textContent).toContain('<img');
  });

  test('should deduplicate equivalent names after normalization and keep the richer email variant', () => {
    displayNames(['john.doe@example.com', 'John Doe', 'Doe, John']);

    const resultList = document.getElementById('resultList');
    expect(resultList.children.length).toBe(1);
    expect(resultList.textContent).toContain('John Doe');
    expect(resultList.textContent).toContain('@example.com');
  });
});

describe('filterAndDisplayDecline', () => {
  beforeEach(() => {
    // Mock DOM elements needed by displayNames
    document.body.innerHTML = '<ul id="resultList"></ul>';
    
    // Mock document.querySelector for scrollIntoView functionality
    document.querySelector = jest.fn().mockReturnValue({
      textContent: 'Interview List',
      scrollIntoView: jest.fn()
    });
  });

  afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  test('should filter names with "Abgesagt" status', () => {
    const tsvData = 'Name\tOtherData\tStatus\nMustermann, Max\tSomeData\tZugesagt\nDoe, John\tSomeData\tAbgesagt\nSmith, Jane\tSomeData\tMit Vorbehalt';
    
    filterAndDisplayDecline(tsvData);
    
    const resultList = document.getElementById('resultList');
    expect(resultList.children.length).toBe(1);
    expect(resultList.innerHTML).toContain('John Doe');
  });

  test('should filter names with "Abgelehnt" status', () => {
    const tsvData = 'Name\tOtherData\tStatus\nMustermann, Max\tSomeData\tZugesagt\nDoe, John\tSomeData\tAbgelehnt\nSmith, Jane\tSomeData\tMit Vorbehalt';
    
    filterAndDisplayDecline(tsvData);
    
    const resultList = document.getElementById('resultList');
    expect(resultList.children.length).toBe(1);
    expect(resultList.innerHTML).toContain('John Doe');
  });

  test('should filter names with both "Abgesagt" and "Abgelehnt" status', () => {
    const tsvData = 'Name\tOtherData\tStatus\nMustermann, Max\tSomeData\tZugesagt\nDoe, John\tSomeData\tAbgesagt\nSmith, Jane\tSomeData\tAbgelehnt\nBrown, Bob\tSomeData\tMit Vorbehalt';
    
    filterAndDisplayDecline(tsvData);
    
    const resultList = document.getElementById('resultList');
    expect(resultList.children.length).toBe(2);
    expect(resultList.innerHTML).toContain('John Doe');
    expect(resultList.innerHTML).toContain('Jane Smith');
  });

  test('should return empty list when no declined entries found', () => {
    const tsvData = 'Name\tOtherData\tStatus\nMustermann, Max\tSomeData\tZugesagt\nSmith, Jane\tSomeData\tMit Vorbehalt';
    
    filterAndDisplayDecline(tsvData);
    
    const resultList = document.getElementById('resultList');
    expect(resultList.children.length).toBe(0);
  });

  test('should handle names without commas', () => {
    const tsvData = 'Name\tOtherData\tStatus\nMax Mustermann\tSomeData\tAbgesagt\nJane Smith\tSomeData\tAbgelehnt';
    
    filterAndDisplayDecline(tsvData);
    
    const resultList = document.getElementById('resultList');
    expect(resultList.children.length).toBe(2);
    expect(resultList.innerHTML).toContain('Max Mustermann');
    expect(resultList.innerHTML).toContain('Jane Smith');
  });

  test('should skip empty rows and rows without names', () => {
    const tsvData = 'Name\tOtherData\tStatus\n\t\tAbgesagt\nDoe, John\tSomeData\tAbgelehnt\n\t\tAbgesagt';
    
    filterAndDisplayDecline(tsvData);
    
    const resultList = document.getElementById('resultList');
    expect(resultList.children.length).toBe(1);
    expect(resultList.innerHTML).toContain('John Doe');
  });

  test('should skip rows with missing status column', () => {
    const tsvData = 'Name\tOtherData\tStatus\nDoe, John\tSomeData\nSmith, Jane\tSomeData\tAbgelehnt';
    
    filterAndDisplayDecline(tsvData);
    
    const resultList = document.getElementById('resultList');
    expect(resultList.children.length).toBe(1);
    expect(resultList.innerHTML).toContain('Jane Smith');
  });

  test('should handle headerless TSV input without dropping the first declined row', () => {
    const tsvData = 'Doe, John\tSomeData\tAbgelehnt\nSmith, Jane\tSomeData\tMit Vorbehalt';

    filterAndDisplayDecline(tsvData);

    const resultList = document.getElementById('resultList');
    expect(resultList.children.length).toBe(1);
    expect(resultList.innerHTML).toContain('John Doe');
  });
});

describe('copyAllSorted', () => {
  let mockGetElementById;
  
  beforeEach(() => {
    // Mock document.getElementById to return our test data and notification element
    mockGetElementById = jest.spyOn(document, 'getElementById').mockImplementation((id) => {
      if (id === 'inputZugesagtData') {
        return { value: '' }; // Will be overridden in individual tests
      }
      if (id === 'copyNotification') {
        return {
          textContent: '',
          style: { display: 'none' },
          setAttribute: jest.fn()
        };
      }
      return null;
    });
    
    // Mock requestAnimationFrame
    global.requestAnimationFrame = jest.fn(cb => cb());
    global.setTimeout = jest.fn(cb => cb());
  });

  afterEach(() => {
    mockGetElementById.mockRestore();
    jest.clearAllMocks();
  });

  test('should group and sort names by status correctly', () => {
    const tsvData = 'Name\tOtherData\tStatus\nMustermann, Max\tSomeData\tZugesagt\nSmith, Jane\tSomeData\tMit Vorbehalt\nDoe, John\tSomeData\tAbgelehnt\nBrown, Bob\tSomeData\tKeine\nAlpha, Alice\tSomeData\tZugesagt';
    
    mockGetElementById.mockImplementation((id) => {
      if (id === 'inputZugesagtData') {
        return { value: tsvData };
      }
      if (id === 'copyNotification') {
        return {
          textContent: '',
          style: { display: 'none' },
          setAttribute: jest.fn()
        };
      }
      return null;
    });
    
    // Mock navigator.clipboard for this test
    const mockWriteText = jest.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: { writeText: mockWriteText }
    });
    
    copyAllSorted();
    
    expect(mockWriteText).toHaveBeenCalledTimes(1);
    
    const copiedText = mockWriteText.mock.calls[0][0];
    
    // Check the structure and content with counts
    expect(copiedText).toContain('---- Zugesagt (2) ----');
    expect(copiedText).toContain('---- Mit Vorbehalt (1) ----');
    expect(copiedText).toContain('---- Abgelehnt (1) ----');
    expect(copiedText).toContain('---- Keine (1) ----');
    
    // Check that names are properly formatted (flipped from "Last, First" to "First Last")
    expect(copiedText).toContain('Alice Alpha'); // Should be sorted first in Zugesagt
    expect(copiedText).toContain('Max Mustermann'); // Should be sorted second in Zugesagt
    expect(copiedText).toContain('Jane Smith');
    expect(copiedText).toContain('John Doe');
    expect(copiedText).toContain('Bob Brown');
  });

  test('should handle empty TSV data', () => {
    mockGetElementById.mockImplementation((id) => {
      if (id === 'inputZugesagtData') {
        return { value: '' };
      }
      if (id === 'copyNotification') {
        return {
          textContent: '',
          style: { display: 'none' },
          setAttribute: jest.fn()
        };
      }
      return null;
    });
    
    const mockWriteText = jest.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: { writeText: mockWriteText }
    });
    
    copyAllSorted();
    
    // Should not call clipboard write for empty data
    expect(mockWriteText).not.toHaveBeenCalled();
  });

  test('should include the first row when TSV data has no header', () => {
    const tsvData = 'Doe, John\tSomeData\tAbgelehnt\nAlpha, Alice\tSomeData\tZugesagt';

    mockGetElementById.mockImplementation((id) => {
      if (id === 'inputZugesagtData') {
        return { value: tsvData };
      }
      if (id === 'copyNotification') {
        return {
          textContent: '',
          style: { display: 'none' },
          setAttribute: jest.fn()
        };
      }
      return null;
    });

    const mockWriteText = jest.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: { writeText: mockWriteText }
    });

    copyAllSorted();

    const copiedText = mockWriteText.mock.calls[0][0];
    expect(copiedText).toContain('---- Zugesagt (1) ----');
    expect(copiedText).toContain('---- Abgelehnt (1) ----');
    expect(copiedText).toContain('Alice Alpha');
    expect(copiedText).toContain('John Doe');
  });
});
