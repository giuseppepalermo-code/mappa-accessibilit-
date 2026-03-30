function openModal(id){
  const modal = document.getElementById(id);
  if(modal){
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id){
  const modal = document.getElementById(id);
  if(modal){
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

document.getElementById('btnLegend').addEventListener('click', () => {
  openModal('legendModal');
});

document.getElementById('btnCloseLegend').addEventListener('click', () => {
  closeModal('legendModal');
});

document.getElementById('btnHowTo').addEventListener('click', () => {
  openModal('howToModal');
});

document.getElementById('btnCloseHowTo').addEventListener('click', () => {
  closeModal('howToModal');
});

window.addEventListener('click', (e) => {
  const legendModal = document.getElementById('legendModal');
  const howToModal = document.getElementById('howToModal');

  if(e.target === legendModal){
    closeModal('legendModal');
  }

  if(e.target === howToModal){
    closeModal('howToModal');
  }
});
