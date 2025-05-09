/**
 * Helper functions for extracting faculty information from various data structures
 */

/**
 * Extracts faculty ID from various possible formats
 * @param {Object|String} faculty - Faculty data which might be a string ID or object with _id
 * @returns {String|null} - Faculty ID or null if not available
 */
export const extractFacultyId = (faculty) => {
  if (!faculty) return null;
  
  if (typeof faculty === 'string') {
    return faculty;
  }
  
  // Handle various object formats
  return faculty._id || faculty.$oid || faculty.id || faculty;
};

/**
 * Process faculty assignments from the backend into a consistent format
 * @param {Array} facultyAssignments - Array of faculty assignments from the backend
 * @returns {Object} - Mapping of subject codes to faculty information
 */
export const processFacultyAssignments = (facultyAssignments) => {
  const subjectFacultyMap = {};
  
  if (!Array.isArray(facultyAssignments)) {
    console.warn('Invalid faculty assignments format:', facultyAssignments);
    return subjectFacultyMap;
  }
  
  facultyAssignments.forEach(assignment => {
    if (!assignment.subjectCode || !assignment.primaryFaculty) return;
    
    // Extract primary faculty ID
    const facultyId = extractFacultyId(assignment.primaryFaculty);
    
    // Get faculty name if available
    const facultyName = typeof assignment.primaryFaculty === 'object' && assignment.primaryFaculty.username
      ? assignment.primaryFaculty.username
      : null;
    
    // Create the initial faculty mapping
    const facultyMapping = {
      facultyId,
      facultyName,
      facultyEmployeeId: facultyId
    };
    
    // Add secondary faculty if present
    if (assignment.secondaryFaculty) {
      const secondaryFacultyId = extractFacultyId(assignment.secondaryFaculty);
      
      // Get faculty name if available
      const secondaryFacultyName = typeof assignment.secondaryFaculty === 'object' && assignment.secondaryFaculty.username
        ? assignment.secondaryFaculty.username
        : null;
      
      facultyMapping.secondaryFacultyId = secondaryFacultyId;
      facultyMapping.secondaryFacultyName = secondaryFacultyName;
      
      console.log(`Found secondary faculty for ${assignment.subjectCode}:`, {
        id: secondaryFacultyId,
        name: secondaryFacultyName
      });
    }
    
    subjectFacultyMap[assignment.subjectCode] = facultyMapping;
  });
  
  return subjectFacultyMap;
};

/**
 * Enhances subject option objects with faculty information
 * @param {Array} subjects - Array of subject data 
 * @param {Object} subjectFacultyMap - Mapping of subject codes to faculty info
 * @returns {Array} - Enhanced subject options with faculty information
 */
export const createSubjectOptions = (subjects, subjectFacultyMap) => {
  return subjects.map(subject => {
    const facultyInfo = subjectFacultyMap[subject.subjectCode] || {};
    const acronym = subject.acronym || generateAcronym(subject.subjectName);
    
    return {
      value: subject.subjectCode,
      label: `${subject.subjectCode} - ${subject.subjectName}`,
      shortLabel: `${acronym} - ${subject.subjectCode}`,
      code: subject.subjectCode,
      _id: subject._id,
      subjectName: subject.subjectName,
      acronym,
      facultyId: facultyInfo.facultyId || null,
      facultyName: facultyInfo.facultyName || 'Not Assigned',
      facultyEmployeeId: facultyInfo.facultyEmployeeId || '',
      secondaryFacultyId: facultyInfo.secondaryFacultyId || null,
      secondaryFacultyName: facultyInfo.secondaryFacultyName || null
    };
  });
};

/**
 * Generate acronym from a subject name
 * @param {String} subjectName - Full subject name
 * @returns {String} - Generated acronym
 */
const generateAcronym = (subjectName) => {
  if (!subjectName) return 'XX';
  return subjectName
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};
