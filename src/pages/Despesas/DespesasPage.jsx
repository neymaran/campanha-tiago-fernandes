import React, { useState, useEffect } from 'react';
import { 
  PageHeader, DataTable, Button, Modal, Input, MaskedInput, 
  Select, Badge, StatsCard, ConfirmDialog, Card, FileUpload 
} from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { validateCPF, validateCNPJ } from '../../utils/formatters';
import './DespesasPage.css';

export default function DespesasPage() {
  const { addToast } = useToast();
  const [despesas, setDespesas] = useState([]);
  const [contasOptions, setContasOptions] = useState([]);
  const [viewMode, setViewMode] = useState('list');

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentDespesa, setCurrentDespesa] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingCNPJ, setIsSearchingCNPJ] = useState(false);

  const [formData, setFormData] = useState({
    cpfCnpj: '', nomeFornecedor: '', dataContratacao: '', itens: [], pagamentos: [], comprovantes: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const qDespesas = query(collection(db, 'despesas'));
    const unsubDespesas = onSnapshot(qDespesas, (snapshot) => {
      setDespesas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });

    const qContas = query(collection(db, 'contas'));
    const unsubContas = onSnapshot(qContas, (snapshot) => {
      const contasData = snapshot.docs.map(doc => {
        const data = doc.data();
        const labelStr = `${data.banco} - ${data.conta}`;
        return { value: labelStr, label: labelStr };
      });
      setContasOptions(contasData);
    });

    return () => {
      unsubDespesas();
      unsubContas();
    };
  }, []);

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const [errors, setErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);

  const calculateTotal = (items) => items.reduce((acc, i) => acc + (parseFloat(i.quantidade||0) * parseFloat(i.valorUnitario||0)), 0);
  const calculatePago = (payments) => payments.reduce((acc, p) => acc + parseFloat(p.valor||0), 0);

  const determineStatus = (total, pago) => {
    if (pago === 0) return 'pendente';
    if (pago >= total) return 'pago';
    return 'parcial';
  };

  const buscarCNPJ = async (cleanCNPJ) => {
    if (!cleanCNPJ || cleanCNPJ.length !== 14) return;

    if (!validateCNPJ(cleanCNPJ)) {
      setErrors(prev => ({ ...prev, cpfCnpj: 'CNPJ inválido de acordo com os dígitos verificadores.' }));
      return;
    }

    setIsSearchingCNPJ(true);
    try {
      let companyName = null;

      // 1. Consulta publica.cnpj.ws (Alta confiabilidade)
      try {
        const res = await fetch(`https://publica.cnpj.ws/cnpj/${cleanCNPJ}`);
        if (res.ok) {
          const data = await res.json();
          companyName = data.razao_social || data.estabelecimento?.nome_fantasia || data.nome_fantasia;
        }
      } catch (e) {
        console.warn('publica.cnpj.ws falhou, tentando alternativa...');
      }

      // 2. Fallback BrasilAPI
      if (!companyName) {
        try {
          const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
          if (res.ok) {
            const data = await res.json();
            companyName = data.razao_social || data.nome_fantasia;
          }
        } catch (e) {
          console.warn('BrasilAPI indisponível');
        }
      }

      // 3. Fallback MinhaReceita
      if (!companyName) {
        try {
          const res = await fetch(`https://minhareceita.org/${cleanCNPJ}`);
          if (res.ok) {
            const data = await res.json();
            companyName = data.razao_social || data.nome_fantasia;
          }
        } catch (e) {
          console.warn('MinhaReceita indisponível');
        }
      }

      if (companyName) {
        setFormData(prev => ({ ...prev, nomeFornecedor: companyName }));
        setErrors(prev => ({ ...prev, cpfCnpj: null }));
        addToast(`CNPJ Identificado: ${companyName}`, 'success');
      } else {
        setErrors(prev => ({ ...prev, cpfCnpj: 'CNPJ não encontrado na Receita Federal.' }));
        addToast('CNPJ não encontrado na Receita Federal.', 'error');
      }
    } catch (e) {
      addToast('Erro ao consultar CNPJ.', 'error');
    } finally {
      setIsSearchingCNPJ(false);
    }
  };

  const handleCpfCnpjChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, cpfCnpj: val }));

    const clean = val.replace(/\D/g, '');
    if (clean.length === 11) {
      if (!validateCPF(clean)) {
        setErrors(prev => ({ ...prev, cpfCnpj: 'CPF inválido (dígitos verificadores incorretos).' }));
      } else {
        setErrors(prev => ({ ...prev, cpfCnpj: null }));
      }
    } else if (clean.length === 14) {
      if (!validateCNPJ(clean)) {
        setErrors(prev => ({ ...prev, cpfCnpj: 'CNPJ inválido (dígitos verificadores incorretos).' }));
      } else {
        setErrors(prev => ({ ...prev, cpfCnpj: null }));
        buscarCNPJ(clean);
      }
    } else if (clean.length > 0 && clean.length < 11) {
      setErrors(prev => ({ ...prev, cpfCnpj: 'Documento incompleto.' }));
    } else {
      setErrors(prev => ({ ...prev, cpfCnpj: null }));
    }
  };

  const handleOpenForm = (despesa = null) => {
    if (despesa) {
      setFormData({ ...despesa });
      setCurrentDespesa(despesa);
    } else {
      setFormData({ cpfCnpj: '', nomeFornecedor: '', dataContratacao: '', itens: [], pagamentos: [], comprovantes: [] });
      setCurrentDespesa(null);
    }
    setErrors({});
    setUploadProgress(0);
    setViewMode('form');
    window.scrollTo(0, 0);
  };

  const handleSave = async () => {
    if (!formData.nomeFornecedor || formData.itens.length === 0) {
      addToast('Preencha os campos obrigatórios e adicione ao menos um item.', 'error');
      return;
    }

    if (formData.cpfCnpj) {
      const cleanDoc = formData.cpfCnpj.replace(/\D/g, '');
      if (cleanDoc.length === 11) {
        if (!validateCPF(cleanDoc)) {
          setErrors(prev => ({ ...prev, cpfCnpj: 'CPF inválido. Corrija o campo antes de salvar.' }));
          addToast('CPF do fornecedor é inválido.', 'error');
          return;
        }
      } else if (cleanDoc.length === 14) {
        if (!validateCNPJ(cleanDoc)) {
          setErrors(prev => ({ ...prev, cpfCnpj: 'CNPJ inválido. Corrija o campo antes de salvar.' }));
          addToast('CNPJ do fornecedor é inválido.', 'error');
          return;
        }
      } else if (cleanDoc.length > 0) {
        setErrors(prev => ({ ...prev, cpfCnpj: 'Documento com número incorreto de dígitos.' }));
        addToast('CPF ou CNPJ informado tem número incorreto de dígitos.', 'error');
        return;
      }
    }

    if (errors.cpfCnpj) {
      addToast('Corrija os erros indicados no formulário antes de salvar.', 'error');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    const cleanedItens = formData.itens.map(i => ({
      ...i,
      quantidade: parseFloat(i.quantidade||0),
      valorUnitario: parseFloat(i.valorUnitario||0),
      total: parseFloat(i.quantidade||0) * parseFloat(i.valorUnitario||0)
    }));

    const cleanedPagamentos = formData.pagamentos.map(p => ({
      ...p,
      valor: parseFloat(p.valor||0)
    }));

    const tDespesa = calculateTotal(cleanedItens);
    const tPago = calculatePago(cleanedPagamentos);
    const novoStatus = determineStatus(tDespesa, tPago);

    const dataToSave = {
      cpfCnpj: formData.cpfCnpj || '',
      nomeFornecedor: formData.nomeFornecedor || '',
      dataContratacao: formData.dataContratacao || '',
      itens: cleanedItens,
      pagamentos: cleanedPagamentos,
      totalDespesa: tDespesa,
      totalPago: tPago,
      status: novoStatus,
      updatedAt: serverTimestamp()
    };

    try {
      let docId;
      if (currentDespesa) {
        docId = currentDespesa.id;
        const docRef = doc(db, 'despesas', docId);
        await updateDoc(docRef, dataToSave);
      } else {
        dataToSave.createdAt = serverTimestamp();
        dataToSave.comprovantes = [];
        const docRef = await addDoc(collection(db, 'despesas'), dataToSave);
        docId = docRef.id;
      }

      const currentFiles = formData.comprovantes || [];
      const filesToUpload = currentFiles.filter(f => f instanceof File);
      const existingFiles = currentFiles.filter(f => !(f instanceof File));
      
      // Limpar do Storage arquivos que foram removidos durante a edicao
      if (currentDespesa && currentDespesa.comprovantes) {
        const removedFiles = currentDespesa.comprovantes.filter(
          oldFile => !existingFiles.some(newFile => newFile.name === oldFile.name)
        );
        removedFiles.forEach((file) => {
          if (file.name) {
            const fileRef = ref(storage, `comprovantes_despesas/${docId}/${file.name}`);
            deleteObject(fileRef).catch(e => console.warn('Erro ao apagar anexo removido:', e));
          }
        });
      }
      
      let finalComprovantes = [...existingFiles];
      
      if (filesToUpload.length > 0) {
        const uploadPromises = filesToUpload.map((file) => {
          return new Promise((resolve, reject) => {
            const fileRef = ref(storage, `comprovantes_despesas/${docId}/${file.name}`);
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
        finalComprovantes = [...finalComprovantes, ...uploadedFiles];
      }
      
      const finalRef = doc(db, 'despesas', docId);
      await updateDoc(finalRef, { comprovantes: finalComprovantes });

      addToast(currentDespesa ? 'Despesa atualizada com sucesso!' : 'Despesa registrada com sucesso!', 'success');
      setViewMode('list');
    } catch (e) {
      console.error('Erro ao salvar despesa:', e);
      addToast('Erro ao salvar despesa.', 'error');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async () => {
    try {
      if (currentDespesa) {
        // 1. Apagar anexos do Storage
        if (currentDespesa.comprovantes && currentDespesa.comprovantes.length > 0) {
          const deletePromises = currentDespesa.comprovantes.map((item) => {
            if (item.name) {
              const fileRef = ref(storage, `comprovantes_despesas/${currentDespesa.id}/${item.name}`);
              return deleteObject(fileRef).catch((e) => console.warn('Erro ao apagar anexo:', e));
            }
            return Promise.resolve();
          });
          await Promise.all(deletePromises);
        }

        // 2. Apagar registro do Firestore
        await deleteDoc(doc(db, 'despesas', currentDespesa.id));
        addToast('Despesa excluída com sucesso', 'success');
        setIsConfirmOpen(false);
      }
    } catch (e) {
      console.error('Erro ao excluir despesa:', e);
      addToast('Erro ao excluir despesa.', 'error');
    }
  };

  const addItem = () => setFormData({ ...formData, itens: [...formData.itens, { id: Math.random().toString(), descricao: '', quantidade: 1, valorUnitario: 0, total: 0 }] });
  const removeItem = (id) => setFormData({ ...formData, itens: formData.itens.filter(i => i.id !== id) });
  const updateItem = (id, field, value) => {
    const newItems = formData.itens.map(i => {
      if (i.id === id) {
        const updated = { ...i, [field]: value };
        updated.total = parseFloat(updated.quantidade||0) * parseFloat(updated.valorUnitario||0);
        return updated;
      }
      return i;
    });
    setFormData({ ...formData, itens: newItems });
  };

  const addPagamento = () => setFormData({ ...formData, pagamentos: [...formData.pagamentos, { id: Math.random().toString(), data: '', valor: 0, numeroDocumento: '', contaOrigem: '' }] });
  const removePagamento = (id) => setFormData({ ...formData, pagamentos: formData.pagamentos.filter(p => p.id !== id) });
  const updatePagamento = (id, field, value) => {
    const realVal = (typeof value === 'object' && value !== null && 'target' in value) ? value.target.value : value;
    setFormData(prev => ({
      ...prev,
      pagamentos: prev.pagamentos.map(p => p.id === id ? { ...p, [field]: realVal } : p)
    }));
  };

  const totalGeral = despesas.reduce((acc, curr) => acc + curr.totalDespesa, 0);
  const totalGeralPago = despesas.reduce((acc, curr) => acc + curr.totalPago, 0);
  const totalGeralPendente = totalGeral - totalGeralPago;

  const dataWithActions = despesas.map(d => ({
    ...d,
    valorTotal: formatCurrency(d.totalDespesa),
    pagoFormatado: formatCurrency(d.totalPago),
    statusBadge: <Badge variant={d.status === 'pago' ? 'success' : d.status === 'parcial' ? 'warning' : 'danger'}>{d.status?.toUpperCase()}</Badge>,
    actions: (
      <div className="action-buttons">
        <Button variant="icon" onClick={() => { setCurrentDespesa(d); setViewMode('details'); window.scrollTo(0, 0); }}>👁️</Button>
        <Button variant="icon" onClick={() => handleOpenForm(d)}>✏️</Button>
        <Button variant="icon" className="danger" onClick={() => { setCurrentDespesa(d); setIsConfirmOpen(true); }}>🗑️</Button>
      </div>
    )
  }));

  return (
    <div className="despesas-page">
      {viewMode === 'list' && (
        <>
          <PageHeader title="Despesas" actions={<Button onClick={() => handleOpenForm()}>Nova Despesa</Button>} />

          <div className="stats-container">
            <StatsCard title="Total de Despesas" value={formatCurrency(totalGeral)} />
            <StatsCard title="Total Pago" value={formatCurrency(totalGeralPago)} />
            <StatsCard title="Total Pendente" value={formatCurrency(totalGeralPendente)} />
          </div>

          <DataTable 
            columns={[
              { key: 'dataContratacao', label: 'Data' },
              { key: 'nomeFornecedor', label: 'Fornecedor' },
              { key: 'cpfCnpj', label: 'CPF/CNPJ' },
              { key: 'valorTotal', label: 'Valor Total' },
              { key: 'pagoFormatado', label: 'Pago' },
              { key: 'statusBadge', label: 'Status' },
              { key: 'actions', label: 'Ações' }
            ]} 
            data={dataWithActions} 
            isLoading={isLoading}
          />
        </>
      )}

      {viewMode === 'form' && (
        <>
          <PageHeader 
            title={currentDespesa ? "Editar Despesa" : "Nova Despesa"} 
            actions={<Button variant="outline" onClick={() => setViewMode('list')}>← Voltar</Button>} 
          />
          <Card>
            <div className="form-grid mb-4">
              <MaskedInput 
                mask="cpfCnpj" 
                label={isSearchingCNPJ ? "CPF ou CNPJ (Consultando Receita Federal...)" : "CPF ou CNPJ"}
                value={formData.cpfCnpj} 
                onChange={handleCpfCnpjChange} 
                error={errors.cpfCnpj}
                placeholder="000.000.000-00 ou 00.000.000/0000-00" 
                endIcon={isSearchingCNPJ ? <span className="spinner" style={{ borderColor: 'rgba(13, 110, 63, 0.3)', borderTopColor: '#0D6E3F' }}></span> : null}
              />
              <Input label="Fornecedor / Razão Social" value={formData.nomeFornecedor} onChange={(e) => setFormData({...formData, nomeFornecedor: e.target.value})} required />
              <MaskedInput mask="date" label="Data de Contratação" value={formData.dataContratacao} onChange={(e) => setFormData({...formData, dataContratacao: e.target.value})} />
            </div>

            <div className="bordered-card">
              <h4>Itens da Despesa</h4>
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Qtd</th>
                    <th>Valor Unitário</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.itens.map(item => (
                    <tr key={item.id}>
                      <td><Input value={item.descricao} onChange={(e) => updateItem(item.id, 'descricao', e.target.value)} /></td>
                      <td><Input type="number" value={item.quantidade} onChange={(e) => updateItem(item.id, 'quantidade', e.target.value)} /></td>
                      <td><Input type="number" step="0.01" value={item.valorUnitario} onChange={(e) => updateItem(item.id, 'valorUnitario', e.target.value)} /></td>
                      <td>{formatCurrency(item.total)}</td>
                      <td><Button variant="icon" className="danger" onClick={() => removeItem(item.id)}>❌</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Button variant="outline" size="sm" onClick={addItem} className="mt-2">+ Adicionar Item</Button>
              <div className="total-geral"><strong>Total Geral:</strong> {formatCurrency(calculateTotal(formData.itens))}</div>
            </div>

            <div className="bordered-card mt-4">
              <h4>Pagamentos</h4>
              <p className="summary-text">
                Total da despesa: <strong>{formatCurrency(calculateTotal(formData.itens))}</strong> | 
                Total já pago: <strong>{formatCurrency(calculatePago(formData.pagamentos))}</strong> | 
                Saldo: <strong>{formatCurrency(calculateTotal(formData.itens) - calculatePago(formData.pagamentos))}</strong>
              </p>
              <table className="items-table mt-2">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Valor</th>
                    <th>Nº Documento</th>
                    <th>Conta Origem</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.pagamentos.map(pag => (
                    <tr key={pag.id}>
                      <td><MaskedInput mask="date" value={pag.data} onChange={(e) => updatePagamento(pag.id, 'data', e.target.value)} /></td>
                      <td><Input type="number" step="0.01" value={pag.valor} onChange={(e) => updatePagamento(pag.id, 'valor', e.target.value)} /></td>
                      <td><Input value={pag.numeroDocumento} onChange={(e) => updatePagamento(pag.id, 'numeroDocumento', e.target.value)} /></td>
                      <td><Select options={contasOptions} value={pag.contaOrigem} onChange={(e) => updatePagamento(pag.id, 'contaOrigem', e.target.value)} /></td>
                      <td><Button variant="icon" className="danger" onClick={() => removePagamento(pag.id)}>❌</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Button variant="outline" size="sm" onClick={addPagamento} className="mt-2">+ Adicionar Pagamento</Button>
            </div>

            <div className="mt-4">
              <FileUpload 
                key={currentDespesa ? currentDespesa.id : 'new'}
                label="Comprovantes e Anexos" 
                multiple 
                accept=".pdf,image/*" 
                initialFiles={currentDespesa && currentDespesa.comprovantes ? currentDespesa.comprovantes : []}
                onFilesChange={(files) => setFormData({...formData, comprovantes: Array.from(files)})} 
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

      {viewMode === 'details' && currentDespesa && (
        <>
          <PageHeader 
            title="Detalhes da Despesa" 
            actions={<Button variant="outline" onClick={() => setViewMode('list')}>← Voltar</Button>} 
          />
          <Card>
            <div className="view-details" style={{ padding: '16px' }}>
              <div className="details-header">
                <p><strong>Fornecedor:</strong> {currentDespesa.nomeFornecedor} ({currentDespesa.cpfCnpj})</p>
                <p><strong>Data:</strong> {currentDespesa.dataContratacao}</p>
                <p><strong>Status:</strong> {currentDespesa.status?.toUpperCase()}</p>
              </div>
              <div className="mt-4">
                <h4>Itens</h4>
                <ul>
                  {currentDespesa.itens.map(i => (
                    <li key={i.id}>{i.quantidade}x {i.descricao} - {formatCurrency(i.valorUnitario)} = {formatCurrency(i.total)}</li>
                  ))}
                </ul>
                <p><strong>Total da Despesa:</strong> {formatCurrency(currentDespesa.totalDespesa)}</p>
              </div>
              <div className="mt-4">
                <h4>Pagamentos</h4>
                <ul>
                  {currentDespesa.pagamentos.map(p => (
                    <li key={p.id}>{p.data} - {formatCurrency(p.valor)} ({p.numeroDocumento} / {p.contaOrigem})</li>
                  ))}
                  {currentDespesa.pagamentos.length === 0 && <li>Nenhum pagamento registrado.</li>}
                </ul>
              </div>
              <div className="mt-4">
                <h4>Comprovantes Anexados</h4>
                <ul>
                  {currentDespesa.comprovantes?.map((f, i) => (
                    <li key={i}>
                      {f.url ? <a href={f.url} target="_blank" rel="noopener noreferrer">{f.name}</a> : f.name}
                    </li>
                  ))}
                  {(!currentDespesa.comprovantes || currentDespesa.comprovantes.length === 0) && <li>Nenhum documento anexado.</li>}
                </ul>
              </div>
            </div>
          </Card>
        </>
      )}

      <ConfirmDialog isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleDelete} title="Excluir Despesa" message="Deseja realmente excluir?" />
    </div>
  );
}
