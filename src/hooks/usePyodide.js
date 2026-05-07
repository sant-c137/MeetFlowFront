import { useState, useEffect, useRef, useCallback } from 'react';

const PYODIDE_CDN_URL = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';

/**
 * Custom Hook to load and initialize Pyodide for executing Python code in the browser.
 * 
 * @returns {Object} { isReady: boolean, evaluatePython: Function }
 */
export const usePyodide = () => {
  const [isReady, setIsReady] = useState(false);
  const pyodideRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const initPyodide = async () => {
      try {
        if (!window.loadPyodide) {
          // Create and append the script tag if not present
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = PYODIDE_CDN_URL;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });
        }

        // Initialize Pyodide
        const pyodide = await window.loadPyodide();
        
        // Load common packages if needed (optional, but good to have)
        // await pyodide.loadPackage(['numpy', 'pandas']); 

        if (isMounted) {
          pyodideRef.current = pyodide;
          setIsReady(true);
        }
      } catch (error) {
        console.error('Failed to load Pyodide:', error);
      }
    };

    initPyodide();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Evaluates Python code, captures stdout, and runs tests.
   * 
   * @param {string} userCode - The Python code written by the user.
   * @param {string} testCode - Additional Python code (e.g., asserts) to run after user code.
   * @param {string} expectedOutput - Optional output to compare against sys.stdout.
   * @returns {Promise<Object>} { success: boolean, output: string, error: string | null }
   */
  const evaluatePython = useCallback(async (userCode, testCode = '', expectedOutput = null) => {
    if (!pyodideRef.current) {
      return { success: false, output: '', error: 'Pyodide is not initialized yet.' };
    }

    try {
      // 1. Setup stdout redirection
      await pyodideRef.current.runPythonAsync(`
import sys
import io
sys.stdout = io.StringIO()
      `);

      // 2. Concatenate user code and test code
      const fullCode = `${userCode}\n${testCode}`;

      // 3. Execute the code
      await pyodideRef.current.runPythonAsync(fullCode);

      // 4. Capture stdout
      const output = await pyodideRef.current.runPythonAsync('sys.stdout.getvalue()');

      // 5. Evaluation: compare output if expectedOutput is provided
      if (expectedOutput !== null) {
        const cleanOutput = output.toString().trim().replace(/\r\n/g, '\n');
        const cleanExpected = expectedOutput.toString().trim().replace(/\r\n/g, '\n');
        
        if (cleanOutput !== cleanExpected) {
          throw new Error(`Incorrect result. Expected: "${cleanExpected}", obtained: "${cleanOutput}"`);
        }
      }

      return {
        success: true,
        output: output,
        error: null,
      };
    } catch (err) {
      // 6. Handle Exceptions (AssertionError, SyntaxError, etc.)
      let errorMessage = err.message;

      // If it's a Python error, try to extract a cleaner message
      if (err.name === 'PythonError' || errorMessage.includes('Python exception')) {
        const lines = errorMessage.split('\n');
        // Usually the last non-empty line contains the actual error (e.g., "AssertionError: ...")
        const filteredLines = lines.filter(line => line.trim() !== '');
        errorMessage = filteredLines[filteredLines.length - 1] || errorMessage;
      }

      return {
        success: false,
        output: '',
        error: errorMessage,
      };
    }
  }, []);

  return { isReady, evaluatePython };
};
