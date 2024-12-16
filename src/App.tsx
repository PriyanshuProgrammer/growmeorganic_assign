import { useEffect, useState } from 'react'
import { useRef } from 'react';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Tag } from 'primereact/tag';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import './App.css'
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

function App() {
  const [isloading, setloading] = useState<boolean>(true)
  const [customers, setCustomers] = useState<any[]>([{}]);
  const [currentpage, setcurrentpage] = useState<number>(0)
  const [selectedProducts, setselectedProducts] = useState<any[]>([])
  const [pendingrows, setpendingrows] = useState<{page:number,rows:number}[]>([{page:0,rows:0}]);
  const op = useRef(null);

  // selection of rows using overlay box input
  function selectpendingrows(){
    let pendingarr = pendingrows;
    let index = -1;
    for(let i = 0 ; i<pendingarr.length; i++){
      if(pendingarr[i].page == currentpage){
        index = i;
        break;
      }
    }
    
    if(index == -1)
      return

    let arr = []
    for(let i = 0 ; i<(pendingarr[index].rows>12?12:pendingarr[index].rows); i++){
      arr.push(customers[12*currentpage+i])
    }
    pendingarr[index].page = currentpage+1 
    if(pendingarr[index].rows>12)
      pendingarr[index].rows -= 12
    else
      pendingarr.splice(index,1)

    setpendingrows(pendingarr)
    setselectedProducts([...selectedProducts,...arr])
  }

  useEffect(function(){
    selectpendingrows()
  },[pendingrows])

  // fetch data from api
  async function fetchdata(page: number) {
    setloading(true)
    let response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${page}`)
    const data = await response.json()
    setloading(false)
    // removing the empty object from the last
    let oldarr = customers
    oldarr.pop()
    setCustomers(customers => [...oldarr])

    let morerows: any = []
    data.data.forEach(function (row: any) {
      let rowdata = {
        id: row.id,
        title: row.title,
        place_of_origin: row.place_of_origin,
        artist_display: row.artist_display,
        inscriptions: row.inspirations,
        date_start: row.date_start,
        date_end: row.date_end
      }
      morerows.push(rowdata)
    })
    // adding an empty object at the last
    morerows.push({})
    setCustomers(customers => [...customers, ...morerows])
  }

  useEffect(function () {
    fetchdata(currentpage + 1)
  }, [currentpage])

  useEffect(function(){
    selectpendingrows()
  },[customers])

  // remove unnecessary data
  function removedata(page: number) {
    let diff = currentpage - page + 1
    let newarr = customers
    newarr.pop()
    for (let i = 0; i < diff * 12; i++) {
      newarr.pop()
    }
    newarr.push({})
    setCustomers(newarr)
  }

  
  // handles page change event
  function onpagechange(event: any) {
    if (event.page > currentpage){
      setcurrentpage(event.page)
      }
    else if (event.page < currentpage) {
      removedata(event.page)
      setcurrentpage(event.page)
    }
  }

  // this function handles the selection of the rows
  function handleselection(event: any) {
    if(Math.abs(selectedProducts.length-event.value.length) == 1){
      setselectedProducts(event.value)
    }
    else if (event.value.length > 12) {
      let newarr = event.value;
      for (let i = 0; i < currentpage * 12; i++) {
        newarr.shift()
      }
      setselectedProducts(products => [...products, ...newarr])
    }
   
  }

  return (
    <>
      <div style={{ display: "flex" }} className="card">
        {
          isloading ? (
            <Tag style={{ marginInline: "auto" }} severity="warning" value="Loading..."></Tag>
          ) : (
            <div>

              <DataTable
                value={customers}
                paginator
                rows={12}
                first={currentpage * 12}
                onPage={onpagechange}
                selectionMode={'checkbox'}
                selection={selectedProducts}
                dataKey={"id"}
                onSelectionChange={handleselection}
                tableStyle={{ minWidth: '50rem' }}>

                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
                <Column header={<Overlay currentpage={currentpage} pending={pendingrows} setpendingrows={setpendingrows} op={op} />} headerStyle={{ width: '3rem' }}></Column>

                <Column field="title" header="Title" style={{ width: '25%' }}></Column>
                <Column field="place_of_origin" header="Place of Origin" style={{ width: '25%' }}></Column>
                <Column field="artist_display" header="Artist" style={{ width: '25%' }}></Column>
                <Column field="inscriptions" header="Inscriptions" style={{ width: '25%' }}></Column>
                <Column field="date_start" header="Start Date" style={{ width: '25%' }}></Column>
                <Column field="date_end" header="End Date" style={{ width: '25%' }}></Column>
              </DataTable>
            </div>
          )
        }

      </div>
    </>
  )
}

// overlay box component
function Overlay({ op, pending, setpendingrows, currentpage }: {op:any, pending:{page:number,rows:number}[],setpendingrows:any, currentpage:number}) {
  let number = 0
  return (
    <>

      <button style={{
        outline: "none",
        backgroundColor: "gray",
        border: "none",
        padding: "2px",
        paddingLeft: "10px",
        paddingRight: "10px",
        borderRadius: "10px",
        color: "white",
        cursor: "pointer"
      }} onClick={(e) => op.current.toggle(e)} >v</button>
      <OverlayPanel ref={op}>
        <div>
          <input onChange={(e)=>{number = parseInt(e.target.value)}}  placeholder='Rows.....' type="text" />
          <button onClick={(e)=>{
            op.current.toggle(e)
            setpendingrows([...pending,{page:currentpage,rows:number}])
          }}>Submit</button>
        </div>
      </OverlayPanel>
    </>
  )
}

export default App

