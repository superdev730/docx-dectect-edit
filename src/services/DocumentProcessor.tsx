import JSZip from 'jszip';

export class DocumentProcessor {
  async readDocxContent(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = new JSZip();
      const doc = await zip.loadAsync(arrayBuffer);
      
      const documentXml = doc.files['word/document.xml'];
      if (!documentXml) {
        throw new Error('Invalid DOCX file: document.xml not found');
      }
      
      const content = await documentXml.async('string');
      return this.extractTextFromXml(content);
    } catch (error) {
      throw new Error(`Failed to read document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractTextFromXml(xml: string): string {
    // Extract text from Word document XML
    const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    const texts: string[] = [];
    let match;
    
    while ((match = textRegex.exec(xml)) !== null) {
      texts.push(match[1]);
    }
    
    return texts.join(' ');
  }

  async modifyDocxFile(file: File, modifications: DocumentModification[]): Promise<Blob> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = new JSZip();
      const doc = await zip.loadAsync(arrayBuffer);
      
      const documentXml = doc.files['word/document.xml'];
      if (!documentXml) {
        throw new Error('Invalid DOCX file: document.xml not found');
      }
      
      let content = await documentXml.async('string');
      
      // Apply modifications
      for (const mod of modifications) {
        content = this.applyModification(content, mod);
      }
      
      // Update the document
      doc.file('word/document.xml', content);
      
      // Generate the modified DOCX
      const modifiedArrayBuffer = await doc.generateAsync({ type: 'arraybuffer' });
      return new Blob([modifiedArrayBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
    } catch (error) {
      throw new Error(`Failed to modify document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private applyModification(xml: string, modification: DocumentModification): string {
    switch (modification.type) {
      case 'insert_after_heading':
        return this.insertAfterHeading(xml, modification.searchText!, modification.insertText, modification.formatting);
      case 'insert_in_section':
        return this.insertInSection(xml, modification.sectionNumber!, modification.insertText, modification.position!);
      case 'add_new_section':
        return this.addNewSection(xml, modification.afterSection!, modification.sectionTitle!, modification.insertText, modification.formatting);
      default:
        return xml;
    }
  }

  private insertAfterHeading(xml: string, headingText: string, insertText: string, formatting?: { bold?: boolean; underline?: boolean }): string {
    // Find the heading paragraph
    const headingRegex = new RegExp(`(<w:p[^>]*>.*?<w:t[^>]*>[^<]*${headingText}[^<]*</w:t>.*?</w:p>)`, 'is');
    const match = xml.match(headingRegex);

    if (match) {
        // Parse the XML to manipulate with DOM
        const parser = new DOMParser();
        const serializer = new XMLSerializer();
        const wNs = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
        const doc = parser.parseFromString(xml, 'application/xml');

        // Extract the first part (e.g., "Affiliate") and the rest of the text
        const textMatch = insertText.match(/^(".*?")(.*)/);
        if (!textMatch) return xml; // Return original if format is unexpected

        const part1 = textMatch[1]; // ""Affiliate""
        const part2 = textMatch[2]; // The rest
        
        // Find the paragraph to copy style from (e.g., the one after the heading)
        const paragraphs = Array.from(doc.getElementsByTagNameNS(wNs, 'p'));
        const headingPara = paragraphs.find(p => p.textContent?.includes(headingText));
        const styleSourcePara = headingPara?.nextElementSibling;

        let paraProps = '';
        let runProps = '';
        if (styleSourcePara) {
            const pPr = styleSourcePara.getElementsByTagNameNS(wNs, 'pPr')[0];
            if (pPr) paraProps = serializer.serializeToString(pPr).replace(/<\/?w<:pPr[^>]*>/g, '');
            const r = styleSourcePara.getElementsByTagNameNS(wNs, 'r')[0];
            if (r) {
                const rPr = r.getElementsByTagNameNS(wNs, 'rPr')[0];
                if (rPr) runProps = serializer.serializeToString(rPr).replace(/<\/?w:rPr[^>]*>/g, '');
            }
        }
        
        // Create the new paragraph with multiple runs for different formatting
        const newParagraphXml = `
            <w:p xmlns:w="${wNs}">
                <w:pPr>${paraProps}</w:pPr>
                <w:r><w:rPr>${runProps}<w:b/></w:rPr><w:t xml:space="preserve">${this.escapeXml(part1)}</w:t></w:r>
                <w:r><w:rPr>${runProps}</w:rPr><w:t xml:space="preserve">${this.escapeXml(part2)}</w:t></w:r>
            </w:p>
        `;

        return xml.replace(match[0], match[0] + newParagraphXml);
    }
    return xml;
  }

  private insertInSection(xml: string, sectionNumber: number, insertText: string, position: 'start' | 'end' | 'between_sentences'): string {
    // Parse XML as DOM
    const parser = new DOMParser();
    const serializer = new XMLSerializer();
    const wNs = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    const doc = parser.parseFromString(xml, 'application/xml');
    const paragraphs = Array.from(doc.getElementsByTagNameNS(wNs, 'p'));

    // Robustly find the paragraph for section 11 by number or by text
    let targetPara: Element | null = null;
    const sectionPattern = new RegExp(`^${sectionNumber}(\.|\s|\t)`, 'i');
    const textPattern = /^The Disclosing Party is/i;

    for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];
        let paraText = '';
        const runs = Array.from(p.getElementsByTagNameNS(wNs, 'r'));
        for (const r of runs) {
            const t = r.getElementsByTagNameNS(wNs, 't')[0];
            if (t && t.textContent) paraText += t.textContent;
        }
        
        const trimmedText = paraText.trim();
        if (sectionPattern.test(trimmedText) || textPattern.test(trimmedText)) {
            console.log(`*** MATCHED section ${sectionNumber} at paragraph ${i}: "${paraText}"`);
            targetPara = p;
            break;
        }
    }

    if (!targetPara) {
        console.log(`Section ${sectionNumber} not found.`);
        return xml;
    }

    const runs = Array.from(targetPara.getElementsByTagNameNS(wNs, 'r'));
    if (runs.length === 0) return xml;

    // Concatenate all text to find the end of the first sentence
    let fullText = '';
    for (const run of runs) {
        const t = run.getElementsByTagNameNS(wNs, 't')[0];
        if (t?.textContent) fullText += t.textContent;
    }

    // Find sentence end (period)
    const sentenceEndMatch = fullText.match(/\./);
    if (!sentenceEndMatch || sentenceEndMatch.index === undefined) return xml;
    const sentenceEndIndex = sentenceEndMatch.index + 1;

    // Split runs at the sentence boundary
    let charsSeen = 0;
    const firstSentenceRuns: Element[] = [];
    const restRuns: Element[] = [];
    for (const run of runs) {
        const t = run.getElementsByTagNameNS(wNs, 't')[0];
        if (!t || !t.textContent) continue;

        const runText = t.textContent;
        const runStart = charsSeen;
        const runEnd = runStart + runText.length;
        charsSeen = runEnd;

        if (runEnd <= sentenceEndIndex) {
            firstSentenceRuns.push(run.cloneNode(true) as Element);
        } else if (runStart >= sentenceEndIndex) {
            restRuns.push(run.cloneNode(true) as Element);
        } else {
            const splitIndex = sentenceEndIndex - runStart;
            const firstPart = runText.substring(0, splitIndex);
            const restPart = runText.substring(splitIndex);

            if (firstPart) {
                const firstPartRun = run.cloneNode(true) as Element;
                firstPartRun.getElementsByTagNameNS(wNs, 't')[0]!.textContent = firstPart;
                firstSentenceRuns.push(firstPartRun);
            }
            if (restPart) {
                const restPartRun = run.cloneNode(true) as Element;
                restPartRun.getElementsByTagNameNS(wNs, 't')[0]!.textContent = restPart;
                restRuns.push(restPartRun);
            }
        }
    }

    // Create a new run for the inserted text, cloning the style of the first run
    const newRun = runs[0].cloneNode(false) as Element; // Clone shell of the run to get <w:rPr>
    const newTextElement = doc.createElementNS(wNs, 't');
    newTextElement.setAttribute('xml:space', 'preserve');
    newTextElement.textContent = ' ' + insertText;
    // Copy run properties if they exist
    const rPr = runs[0].getElementsByTagNameNS(wNs, 'rPr')[0];
    if (rPr) newRun.appendChild(rPr.cloneNode(true));
    newRun.appendChild(newTextElement);

    // Rebuild the paragraph
    // Clear existing runs
    while (targetPara.firstChild) {
      if (targetPara.firstChild.nodeName === 'w:r') {
        targetPara.removeChild(targetPara.firstChild);
      } else {
        break; // Stop at non-run elements like <w:pPr>
      }
    }
    const paraChildren = Array.from(targetPara.childNodes);
    paraChildren.filter(c => c.nodeName === 'w:r').forEach(c => targetPara.removeChild(c));


    // Append new runs in order
    firstSentenceRuns.forEach(r => targetPara.appendChild(r));
    targetPara.appendChild(newRun);
    restRuns.forEach(r => targetPara.appendChild(r));

    // Serialize back to string
    return serializer.serializeToString(doc);
  }

  private addNewSection(xml: string, afterSection: number, sectionTitle: string, insertText: string, formatting?: { bold?: boolean; underline?: boolean }): string {
    // Parse XML as DOM
    const parser = new DOMParser();
    const serializer = new XMLSerializer();
    const wNs = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    const doc = parser.parseFromString(xml, 'application/xml');
    const paragraphs = Array.from(doc.getElementsByTagNameNS(wNs, 'p'));

    // Find the paragraph containing the section number (e.g., 10.)
    let insertIdx = -1;
    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const texts = Array.from(p.getElementsByTagNameNS(wNs, 't'));
      const combined = texts.map(t => t.textContent?.trim() || '').join(' ');
      if (combined.match(new RegExp(`^${afterSection}[\.|\)]`))) {
        insertIdx = i;
      }
    }
    if (insertIdx === -1) return xml;

    // Get style from previous heading and previous body/content
    const prevHeading = paragraphs[insertIdx];
    let headingRunProps = '';
    // Heading style: from first run in heading paragraph
    const firstRun = prevHeading.getElementsByTagNameNS(wNs, 'r')[0];
    if (firstRun) {
      const rPr = firstRun.getElementsByTagNameNS(wNs, 'rPr')[0];
      if (rPr) headingRunProps = serializer.serializeToString(rPr).replace(/<\/?w:rPr[^>]*>/g, '');
    }
    // Body style: from first run and <w:pPr> in the next paragraph that is not a heading
    let contentRunProps = '';
    let contentParaProps = '';
    for (let j = insertIdx + 1; j < paragraphs.length; j++) {
      const p = paragraphs[j];
      const texts = Array.from(p.getElementsByTagNameNS(wNs, 't'));
      const combined = texts.map(t => t.textContent?.trim() || '').join(' ');
      if (!combined.match(/^\d+[\.|\)]/)) {
        // <w:rPr>
        const run = p.getElementsByTagNameNS(wNs, 'r')[0];
        if (run) {
          const rPr = run.getElementsByTagNameNS(wNs, 'rPr')[0];
          if (rPr) {
            contentRunProps = serializer.serializeToString(rPr).replace(/<\/?w:rPr[^>]*>/g, '');
          }
        }
        // <w:pPr>
        const pPr = p.getElementsByTagNameNS(wNs, 'pPr')[0];
        if (pPr) {
          let rawPPr = serializer.serializeToString(pPr).replace(/<\/?w:pPr[^>]*>/g, '');
          // Remove break-related properties
          rawPPr = rawPPr.replace(/<w:pageBreakBefore\s*\/?>/g, '');
          rawPPr = rawPPr.replace(/<w:br[\s\S]*?\/>/g, '');
          rawPPr = rawPPr.replace(/<w:sectPr[\s\S]*?<\/w:sectPr>/g, '');
          contentParaProps = rawPPr;
        }
        break;
      }
    }
    // Fallback: use heading style if no body style found
    if (!contentRunProps) contentRunProps = headingRunProps;

    // Create new section as a single paragraph with multiple runs for different formatting
    const escapeXml = (text: string) => this.escapeXml(text);
    const newSectionNumber = afterSection + 1;
    const paraPropsTag = contentParaProps ? `<w:pPr>${contentParaProps}</w:pPr>` : '';
    
    // Run for the section number (no underline)
    const numberRunPropsTag = headingRunProps ? `<w:rPr>${headingRunProps.replace(/<w:u[\s\S]*?\/>/g, '')}</w:rPr>` : '';
    const numberRun = `<w:r>${numberRunPropsTag}<w:t xml:space="preserve">${escapeXml(`${newSectionNumber}. `)}</w:t></w:r>`;

    // Run for the title (with underline)
    let titleRunProps = headingRunProps || '';
    if (formatting?.underline) {
        if (!titleRunProps.includes('<w:u ')) {
            titleRunProps += '<w:u w:val="single"/>';
        }
    }
    const titleRunPropsTag = titleRunProps ? `<w:rPr>${titleRunProps}</w:rPr>` : '';
    const titleRun = `<w:r>${titleRunPropsTag}<w:t xml:space="preserve">${escapeXml(sectionTitle)}</w:t></w:r>`;

    // Run for the content
    const contentRunPropsTag = contentRunProps ? `<w:rPr>${contentRunProps}</w:rPr>` : '';
    const contentRun = `<w:r>${contentRunPropsTag}<w:t xml:space="preserve">${escapeXml(` ${insertText}`)}</w:t></w:r>`;
    
    const newSectionParagraphXml =
      `<w:p xmlns:w="${wNs}">
        ${paraPropsTag}
        ${numberRun}
        ${titleRun}
        ${contentRun}
      </w:p>`;
    const newSectionParagraph = parser.parseFromString(newSectionParagraphXml, 'application/xml').documentElement;

    // Insert the new section paragraph after the found paragraph
    const parent = paragraphs[insertIdx].parentNode;
    if (parent) {
      parent.insertBefore(newSectionParagraph, paragraphs[insertIdx + 1] || null);
    }

    // Renumber all subsequent section headings
    for (let i = insertIdx + 1; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const texts = Array.from(p.getElementsByTagNameNS(wNs, 't'));
      for (const t of texts) {
        const match = t.textContent?.trim().match(/^(\d+)([\.|\)])(.*)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num >= newSectionNumber) {
            t.textContent = (num + 1) + match[2] + match[3];
          }
        }
      }
    }

    // Serialize back to string
    return serializer.serializeToString(doc);
  }

  private incrementSectionNumbers(xml: string, startSection: number): string {
    // Match paragraphs that look like numbered section headings (e.g., 11., 12., ...), even with extra text
    for (let n = 0; n < 50; n++) { // limit to 50 increments for safety
      const current = startSection + n;
      const next = current + 1;
      // Regex: find <w:t>current. ...</w:t> at the start of a paragraph, even with extra text
      const regex = new RegExp(`(<w:p[^>]*>[\s\S]*?<w:t[^>]*>\s*)${current}([\.\)])`, 'g');
      if (!regex.test(xml)) break;
      xml = xml.replace(regex, `$1${next}$2`);
    }
    return xml;
  }

  private createParagraph(text: string, formatting?: { bold?: boolean; underline?: boolean }, runPropertiesXml?: string): string {
    let runProperties = runPropertiesXml || '';
    if (!runProperties && formatting?.bold) runProperties += '<w:b/>';
    if (!runProperties && formatting?.underline) runProperties += '<w:u w:val="single"/>';
    const runPropsTag = runProperties ? `<w:rPr>${runProperties}</w:rPr>` : '';
    return `<w:p><w:pPr></w:pPr><w:r>${runPropsTag}<w:t xml:space="preserve">${this.escapeXml(text)}</w:t></w:r></w:p>`;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

export interface DocumentModification {
  type: 'insert_after_heading' | 'insert_in_section' | 'add_new_section';
  searchText?: string;
  sectionNumber?: number;
  position?: 'start' | 'end' | 'between_sentences';
  afterSection?: number;
  sectionTitle?: string;
  insertText: string;
  formatting?: { bold?: boolean; underline?: boolean };
}