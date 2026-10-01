import React, { useState, useEffect } from 'react';
import { 
  PageHeader, DataTable, Button, Card, Input, MaskedInput, 
  FileUpload, StatsCard, ConfirmDialog, Badge 
} from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { formatCurrency, parseCurrency, validateCPF } from '../../utils/formatters';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './DoacoesPage.css';

export default function DoacoesPage() {
  const { addToast } = useToast();
  const [doacoes, setDoacoes] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentDoacao, setCurrentDoacao] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    data: '', nomeDoador: '', valor: '', cpf: '', numeroDocumento: '', identidades: [], lancado: false
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroLancado, setFiltroLancado] = useState('todos');

  // Import State
  const [importData, setImportData] = useState([]);
  const [importErrors, setImportErrors] = useState([]);

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Data (DD/MM/YYYY)', 'Nome do Doador', 'CPF (Somente Números)', 'Valor (Ex: 150.50)', 'Nº Documento']
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Doacoes');
    XLSX.writeFile(wb, 'Template_Importacao_Doacoes.xlsx');
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      const rows = data.slice(1).filter(r => r.length > 0 && r.some(c => c !== undefined && c !== '')); 
      
      const parsed = [];
      const errs = [];

      rows.forEach((row, index) => {
        const [dataObj, nome, cpfVal, valorVal, numDoc] = row;
        const rowNum = index + 2;
        let rowErrors = [];

        let dataStr = dataObj;
        if (typeof dataObj === 'number') {
           const dateInfo = XLSX.SSF.parse_date_code(dataObj);
           dataStr = `${String(dateInfo.d).padStart(2, '0')}/${String(dateInfo.m).padStart(2, '0')}/${dateInfo.y}`;
        } else if (dataObj) {
           dataStr = String(dataObj).trim();
        }

        const nomeStr = nome ? String(nome).trim() : '';
        const cpfStr = cpfVal ? String(cpfVal).replace(/\D/g, '') : '';
        const numDocStr = numDoc ? String(numDoc).trim() : '';
        
        let valorNum = 0;
        if (typeof valorVal === 'number') {
           valorNum = valorVal;
        } else if (typeof valorVal === 'string') {
           valorNum = parseFloat(valorVal.replace(',', '.'));
        }

        if (!dataStr) rowErrors.push('Data é obrigatória');
        if (!nomeStr) rowErrors.push('Nome do Doador é obrigatório');
        if (!valorNum || isNaN(valorNum)) rowErrors.push('Valor inválido');
        if (!cpfStr || cpfStr.length !== 11 || !validateCPF(cpfStr)) rowErrors.push('CPF inválido');

        const item = {
           linha: rowNum,
           data: dataStr || '',
           nomeDoador: nomeStr,
           cpf: cpfStr,
           valor: isNaN(valorNum) ? 0 : valorNum,
           numeroDocumento: numDocStr
        };

        parsed.push(item);
        if (rowErrors.length > 0) {
           errs.push({ linha: rowNum, errors: rowErrors, item });
        }
      });

      setImportData(parsed);
      setImportErrors(errs);
    };
    reader.readAsBinaryString(file);
  };

  const confirmImport = async (ignoreErrors = false) => {
    setIsSubmitting(true);
    let successCount = 0;
    try {
      const toImport = ignoreErrors 
        ? importData.filter(d => !importErrors.find(e => e.linha === d.linha))
        : importData;

      if (toImport.length === 0) {
        addToast('Nenhum dado válido para importar.', 'warning');
        setIsSubmitting(false);
        return;
      }

      for (const item of toImport) {
        await addDoc(collection(db, 'doacoes'), {
          data: item.data,
          nomeDoador: item.nomeDoador,
          cpf: item.cpf,
          valor: item.valor,
          numeroDocumento: item.numeroDocumento,
          identidades: [],
          lancado: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        successCount++;
      }

      addToast(`${successCount} doações importadas com sucesso!`, 'success');
      setViewMode('list');
      setImportData([]);
      setImportErrors([]);
    } catch (err) {
      console.error(err);
      addToast('Erro ao importar doações', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'doacoes'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDoacoes(data);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching doacoes:', error);
      addToast('Erro ao carregar doações', 'error');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [addToast]);

  const totalValor = doacoes.reduce((acc, curr) => acc + (curr.valor || 0), 0);

  const columns = [
    { key: 'data', label: 'Data' },
    { key: 'nomeDoador', label: 'Doador' },
    { key: 'cpf', label: 'CPF' },
    { key: 'valorFormatted', label: 'Valor' },
    { key: 'numeroDocumento', label: 'Nº Documento' },
    { key: 'anexoBadge', label: 'Anexo' },
    { key: 'lancadoCheck', label: 'Lançado' },
    { key: 'actions', label: 'Ações' }
  ];

  const handleCpfChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, cpf: val }));
    const clean = val.replace(/\D/g, '');
    if (clean.length === 11) {
      if (!validateCPF(clean)) {
        setErrors(prev => ({ ...prev, cpf: 'CPF inválido (dígitos verificadores incorretos).' }));
      } else {
        setErrors(prev => ({ ...prev, cpf: null }));
      }
    } else if (clean.length > 0 && clean.length < 11) {
      setErrors(prev => ({ ...prev, cpf: 'CPF incompleto (11 dígitos).' }));
    } else {
      setErrors(prev => ({ ...prev, cpf: null }));
    }
  };

  const handleOpenForm = (doacao = null) => {
    if (doacao) {
      setFormData({ ...doacao, valor: doacao.valor ? doacao.valor.toString() : '' });
      setCurrentDoacao(doacao);
    } else {
      setFormData({ data: '', nomeDoador: '', valor: '', cpf: '', numeroDocumento: '', identidades: [], lancado: false });
      setCurrentDoacao(null);
    }
    setErrors({});
    setUploadProgress(0);
    setViewMode('form');
    window.scrollTo(0, 0);
  };

  const handleSave = async () => {
    if (!formData.data || !formData.nomeDoador || !formData.valor || !formData.cpf) {
      addToast('Preencha os campos obrigatórios', 'error');
      return;
    }
    
    if (!validateCPF(formData.cpf)) {
      setErrors(prev => ({ ...prev, cpf: 'CPF inválido. Corrija o campo antes de salvar.' }));
      addToast('CPF inválido. Verifique os números digitados.', 'error');
      return;
    }

    if (errors.cpf) {
      addToast('Corrija o erro no campo de CPF antes de salvar.', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const valorNum = parseCurrency(formData.valor.toString());
      
      const doacaoData = {
        data: formData.data,
        nomeDoador: formData.nomeDoador,
        valor: valorNum,
        cpf: formData.cpf,
        numeroDocumento: formData.numeroDocumento,
        lancado: formData.lancado || false,
      };

      let docId;
      if (currentDoacao) {
        docId = currentDoacao.id;
        const doacaoRef = doc(db, 'doacoes', docId);
        await updateDoc(doacaoRef, {
          ...doacaoData,
          updatedAt: serverTimestamp()
        });
      } else {
        const docRef = await addDoc(collection(db, 'doacoes'), {
          ...doacaoData,
          identidades: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        docId = docRef.id;
      }

      const currentFiles = formData.identidades || [];
      const filesToUpload = currentFiles.filter(f => f instanceof File);
      const existingFiles = currentFiles.filter(f => !(f instanceof File));

      // Limpar do Storage arquivos que foram removidos durante a edicao
      if (currentDoacao && currentDoacao.identidades) {
        const removedFiles = currentDoacao.identidades.filter(
          oldFile => !existingFiles.some(newFile => newFile.name === oldFile.name)
        );
        removedFiles.forEach((file) => {
          if (file.name) {
            const fileRef = ref(storage, `identidades/${docId}/${file.name}`);
            deleteObject(fileRef).catch(e => console.warn('Erro ao apagar anexo removido:', e));
          }
        });
      }
      
      let finalIdentidades = [...existingFiles];
      
      if (filesToUpload.length > 0) {
        const uploadPromises = filesToUpload.map((file) => {
          return new Promise((resolve, reject) => {
            const fileRef = ref(storage, `identidades/${docId}/${file.name}`);
            const uploadTask = uploadBytesResumable(fileRef, file);
            
            uploadTask.on(
              'state_changed',
              (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
              },
              (error) => reject(error),
              async () => {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                resolve({
                  name: file.name,
                  url: downloadUrl,
                  size: file.size
                });
              }
            );
          });
        });
        
        const uploadedFiles = await Promise.all(uploadPromises);
        finalIdentidades = [...finalIdentidades, ...uploadedFiles];
      }
      
      const finalRef = doc(db, 'doacoes', docId);
      await updateDoc(finalRef, {
        identidades: finalIdentidades
      });
      
      addToast(currentDoacao ? 'Doação atualizada com sucesso' : 'Doação registrada com sucesso', 'success');
      setViewMode('list');
    } catch (error) {
      console.error('Erro ao salvar doação:', error);
      addToast('Erro ao salvar doação', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (currentDoacao) {
        // 1. Apagar anexos do Storage
        if (currentDoacao.identidades && currentDoacao.identidades.length > 0) {
          const deletePromises = currentDoacao.identidades.map((item) => {
            if (item.name) {
              const fileRef = ref(storage, `identidades/${currentDoacao.id}/${item.name}`);
              return deleteObject(fileRef).catch((e) => console.warn('Erro ao apagar anexo:', e));
            }
            return Promise.resolve();
          });
          await Promise.all(deletePromises);
        }

        // 2. Apagar registro do Firestore
        await deleteDoc(doc(db, 'doacoes', currentDoacao.id));
        addToast('Doação excluída com sucesso', 'success');
        setIsConfirmOpen(false);
      }
    } catch (error) {
      console.error('Erro ao excluir doação:', error);
      addToast('Erro ao excluir doação', 'error');
    }
  };

  const handleToggleLancado = async (doacao) => {
    try {
      await updateDoc(doc(db, 'doacoes', doacao.id), {
        lancado: !doacao.lancado,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Erro ao atualizar status de lançamento:', err);
      addToast('Erro ao atualizar status', 'error');
    }
  };

  const filteredDoacoes = doacoes.filter(d => {
    if (filtroLancado === 'sim') return d.lancado === true;
    if (filtroLancado === 'nao') return !d.lancado;
    return true;
  });

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Configurar título
    doc.setFontSize(18);
    doc.text('Relatório de Doações', 14, 22);
    
    // Detalhes
    doc.setFontSize(10);
    doc.setTextColor(100);
    const dateStr = new Date().toLocaleDateString('pt-BR');
    doc.text(`Gerado em: ${dateStr}`, 14, 30);
    
    // Preparar dados para tabela
    const tableColumn = ["Data", "Doador", "CPF", "Nº Doc.", "Valor", "Lançado"];
    const tableRows = [];

    filteredDoacoes.forEach(d => {
      const row = [
        d.data || '',
        d.nomeDoador || '',
        d.cpf || '',
        d.numeroDocumento || '',
        formatCurrency(d.valor || 0),
        d.lancado ? 'Sim' : 'Não'
      ];
      tableRows.push(row);
    });

    // Calcular totais
    const totalFiltrado = filteredDoacoes.reduce((acc, curr) => acc + (curr.valor || 0), 0);
    tableRows.push(['', '', '', 'TOTAL:', formatCurrency(totalFiltrado), '']);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [13, 110, 63] }, // Tema verde
      didParseCell: function(data) {
        if (data.row.index === tableRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    doc.save('relatorio-doacoes.pdf');
  };

  const dataWithActions = filteredDoacoes.map(d => {
    const hasAnexo = Boolean(d.identidades && d.identidades.length > 0);
    return {
      ...d,
      valorFormatted: formatCurrency(d.valor),
      anexoBadge: (
        <Badge variant={hasAnexo ? 'info' : 'neutral'} size="sm">
          {hasAnexo ? '📎 Com anexo' : 'Sem anexo'}
        </Badge>
      ),
      lancadoCheck: (
        <input 
          type="checkbox" 
          checked={!!d.lancado} 
          onChange={() => handleToggleLancado(d)} 
          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
        />
      ),
      actions: (
        <div className="action-buttons">
          <Button variant="icon" onClick={() => { setCurrentDoacao(d); setViewMode('details'); window.scrollTo(0, 0); }}>👁️</Button>
          <Button variant="icon" onClick={() => handleOpenForm(d)}>✏️</Button>
          <Button variant="icon" className="danger" onClick={() => { setCurrentDoacao(d); setIsConfirmOpen(true); }}>🗑️</Button>
        </div>
      )
    };
  });

  return (
    <div className="doacoes-page">
      {viewMode === 'list' && (
        <>
          <PageHeader 
            title="Doações" 
            actions={
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="outline" onClick={handleExportPDF}>Exportar PDF</Button>
                <Button variant="outline" onClick={() => {
                  setImportData([]); setImportErrors([]); setViewMode('import'); window.scrollTo(0, 0);
                }}>Importar Planilha</Button>
                <Button onClick={() => handleOpenForm()}>Nova Doação</Button>
              </div>
            } 
          />

          <div className="stats-container">
            <StatsCard title="Total de Doações" value={doacoes.length} />
            <StatsCard title="Valor Total" value={formatCurrency(totalValor)} />
          </div>

          <div className="filter-bar">
            <Input placeholder="Buscar por nome..." />
            <MaskedInput mask="date" placeholder="Data inicial" />
            <MaskedInput mask="date" placeholder="Data final" />
            <select 
              value={filtroLancado} 
              onChange={(e) => setFiltroLancado(e.target.value)}
              className="ui-input"
            >
              <option value="todos">Todos (Lançamento)</option>
              <option value="sim">Lançados</option>
              <option value="nao">Não Lançados</option>
            </select>
          </div>

          <DataTable columns={columns} data={dataWithActions} isLoading={isLoading} />
        </>
      )}

      {viewMode === 'import' && (
        <>
          <PageHeader 
            title="Importar Doações" 
            actions={<Button variant="outline" onClick={() => setViewMode('list')}>← Voltar</Button>} 
          />
          <Card className="form-card">
            <div style={{ marginBottom: '20px' }}>
              <h3>1. Baixe o Layout</h3>
              <p>Utilize a planilha modelo para preencher as doações corretamente. Não altere a ordem das colunas.</p>
              <Button onClick={downloadTemplate} variant="outline">Baixar Planilha de Exemplo (.xlsx)</Button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3>2. Envie o Arquivo Preenchido</h3>
              <input type="file" accept=".xlsx, .xls" onChange={handleImportFile} style={{ display: 'block', marginTop: '10px' }} />
            </div>

            {importData.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h3>Resumo da Importação</h3>
                <p>Total de linhas lidas: {importData.length}</p>
                <p>Linhas com erro: <span style={{ color: importErrors.length > 0 ? '#d93025' : '#1e8e3e', fontWeight: 'bold' }}>{importErrors.length}</span></p>

                {importErrors.length > 0 && (
                  <div style={{ background: '#fce8e6', padding: '15px', borderRadius: '8px', marginTop: '15px' }}>
                    <h4 style={{ color: '#d93025', marginTop: 0 }}>Atenção: Foram encontrados erros nas seguintes linhas:</h4>
                    <ul style={{ color: '#d93025', margin: 0, paddingLeft: '20px', maxHeight: '150px', overflowY: 'auto' }}>
                      {importErrors.map((err, idx) => (
                        <li key={idx}><strong>Linha {err.linha}:</strong> {err.errors.join(', ')}</li>
                      ))}
                    </ul>
                    <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#d93025' }}>
                      Você pode cancelar e corrigir a planilha, ou importar apenas as linhas válidas ignorando os erros.
                    </p>
                  </div>
                )}

                <div className="modal-actions mt-4" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <Button variant="outline" onClick={() => setViewMode('list')} disabled={isSubmitting}>Cancelar</Button>
                  {importErrors.length > 0 ? (
                    <Button onClick={() => confirmImport(true)} isLoading={isSubmitting} className="danger">
                      Importar Ignorando Erros
                    </Button>
                  ) : (
                    <Button onClick={() => confirmImport(false)} isLoading={isSubmitting}>
                      Confirmar Importação
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      {viewMode === 'form' && (
        <>
          <PageHeader 
            title={currentDoacao ? "Editar Doação" : "Nova Doação"} 
            actions={<Button variant="outline" onClick={() => setViewMode('list')}>← Voltar</Button>} 
          />
          <Card className="form-card">
            <div className="form-grid">
              <MaskedInput mask="date" label="Data da doação" value={formData.data} onChange={(e) => setFormData({...formData, data: e.target.value})} required />
              <Input label="Nome Completo do Doador" value={formData.nomeDoador} onChange={(e) => setFormData({...formData, nomeDoador: e.target.value})} required />
              <MaskedInput mask="currency" label="Valor (R$)" value={formData.valor} onChange={(e) => setFormData({...formData, valor: e.target.value})} required />
              <MaskedInput mask="cpf" label="CPF" value={formData.cpf} onChange={handleCpfChange} error={errors.cpf} required />
              <Input label="Nº do Documento no extrato" value={formData.numeroDocumento} onChange={(e) => setFormData({...formData, numeroDocumento: e.target.value})} required />
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', gridColumn: '1 / -1', cursor: 'pointer', marginTop: '10px' }}>
                <input 
                  type="checkbox" 
                  checked={formData.lancado || false} 
                  onChange={(e) => setFormData({...formData, lancado: e.target.checked})} 
                  style={{ width: '18px', height: '18px' }}
                />
                Marcar como Lançado
              </label>
            </div>
            <div className="mt-4">
              <FileUpload 
                key={currentDoacao ? currentDoacao.id : 'new'}
                label="Identidade do Doador" 
                multiple 
                accept=".pdf,image/*" 
                initialFiles={currentDoacao && currentDoacao.identidades ? currentDoacao.identidades : []}
                onFilesChange={(files) => setFormData({...formData, identidades: Array.from(files)})} 
                isUploading={isSubmitting}
                uploadProgress={uploadProgress}
              />
            </div>
            <div className="modal-actions mt-4" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setViewMode('list')} disabled={isSubmitting}>Cancelar</Button>
              <Button onClick={handleSave} isLoading={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar'}</Button>
            </div>
          </Card>
        </>
      )}

      {viewMode === 'details' && currentDoacao && (
        <>
          <PageHeader 
            title="Detalhes da Doação" 
            actions={<Button variant="outline" onClick={() => setViewMode('list')}>← Voltar</Button>} 
          />
          <Card className="view-details-card">
            <div className="view-details">
              <p><strong>Data:</strong> {currentDoacao.data}</p>
              <p><strong>Doador:</strong> {currentDoacao.nomeDoador}</p>
              <p><strong>CPF:</strong> {currentDoacao.cpf}</p>
              <p><strong>Valor:</strong> {formatCurrency(currentDoacao.valor)}</p>
              <p><strong>Documento:</strong> {currentDoacao.numeroDocumento}</p>
              <p><strong>Lançado:</strong> {currentDoacao.lancado ? 'Sim' : 'Não'}</p>
              <div className="mt-4">
                <h4>Documentos Anexados:</h4>
                <ul>
                  {currentDoacao.identidades?.map((f, i) => (
                    <li key={i}>
                      {f.url ? <a href={f.url} target="_blank" rel="noopener noreferrer">{f.name}</a> : f.name}
                    </li>
                  ))}
                  {(!currentDoacao.identidades || currentDoacao.identidades.length === 0) && <li>Nenhum documento anexado.</li>}
                </ul>
              </div>
            </div>
          </Card>
        </>
      )}

      <ConfirmDialog 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleDelete} 
        title="Excluir Doação" 
        message="Tem certeza que deseja excluir esta doação? Esta ação não pode ser desfeita." 
      />
    </div>
  );
}
