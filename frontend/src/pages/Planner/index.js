import React, { useEffect, useState } from 'react'
import { Appointment } from '../../components/Appointment'
import {DarkButton} from '../../components/DarkButton'
import Logo from '../../assets/logo.png'
import {FiEdit, FiX} from 'react-icons/fi'

import './styles.css'
import api from '../../services/api'
import { useHistory } from 'react-router-dom'
import { Formik } from 'formik'
import moment from 'moment'
import { useUser } from '../../contexts/userContext'



export function Planner(){
    const [appointments, setAppointments] = useState([])
    const [modalVissible, setModalVisible] = useState(false)
    const[selectedAppointment, setSelectedAppointment] = useState()
    const [modalType, setModalType] = useState('')
    const [reloadAppointemnts, setReloadAppointments] = useState(false)
    const {userToken} = useUser()

    const history = useHistory()
    const month = moment(new Date()).format('MM')
    const nextMonth = moment(new Date()).add(1, 'M').format('MM')
    const year = new Date().getFullYear()

    async function createAppointment(data){
        const date = `${data.date} ${data.time}`
        try {
            await api.post('/criarConsulta', {...data, date: date})
            setModalVisible(false)
            setReloadAppointments(!reloadAppointemnts)
        } catch (error) {
            console.log(error)
        }
    }

    async function updateAppointment(values){
        const data = {
            name: values.name,
            price: values.price,
            date:`${values.date} ${values.time}`
        }
        try {
            console.log(selectedAppointment.id)
            await api.put(`/atualizarConsulta/${selectedAppointment.id}`, data)
            setModalVisible(false)
            setReloadAppointments(!reloadAppointemnts)

        } catch (error) {
            console.log(error)
        }
    }

    async function deleteAppointment(){
        try {
            await api.delete(`/deletarConsulta/${selectedAppointment.id}`)
            setModalVisible(false)
            setReloadAppointments(!reloadAppointemnts)
        } catch (error) {
            console.log(error)
        }
    }

    function handleAppointmentEditClick(appointment){
        setModalVisible(true) 
        setModalType('update')
        setSelectedAppointment(appointment)
    }

    function handleAppointmentDeleteClick(appointment){
        setModalVisible(true)
        setModalType('delete')
        setSelectedAppointment(appointment)
    }

    function handleUserEditClick(){
        setModalVisible(true)
        setModalType('user')
    }

    async function handleUpdateUser(values){
        try {
            await api.put('/atualizarConta', values)
            if(values.name) localStorage.setItem('userName', values.name)
            setModalVisible(false)
        } catch (error) {
            console.log(error)
        }
    }

    async function handleDeleteUser(){
        try {
            await api.delete('/deletarConta')
            setModalVisible(false)
            history.push('/')
        } catch (error) {
            
        }
    }

    function handleLogOut(){
        localStorage.removeItem('token')
        localStorage.removeItem('userName')

        history.push('/')
    }

  

    useEffect(()=>{
        async function loadAppointments(){
            try {
                const response =  await api.get('/minhasConsultas')
                setAppointments(response.data)
            } catch (error) {
                console.log("planner error: ",error.response)
                if(error.response && ( error.response.status === 401 || error.response.status === 403)){
                    history.push('/login')
                }
            }
        }

        loadAppointments()
    },[reloadAppointemnts, history])

    return(
        <div className="plannerContainer">
            <header>
                <img src={Logo} alt="DoctorWeb"/>
                
                <div className="userArea">
                    <DarkButton title="Adicionar" action={()=> {setModalVisible(true); setModalType('add')}} />
                    <DarkButton id="logOut" title="Sair" action={handleLogOut} />
                    <span>Bem-vindo(a), { userToken && localStorage.getItem('userName')}</span>
                    <div className="userIcon">{userToken && localStorage.getItem('userName')[0]}</div>
                    <div className="editInfo">
                        <FiEdit onClick={handleUserEditClick} color="#FFFF" size={24} />
                    </div>
                </div>

            </header>

            <main>
                <div className="card">
                    <h1>Este mês</h1>
                    { appointments.length>0 && appointments.map(appointment => {
                        
                        if(appointment.mes === month && appointment.ano === year ){
                            return(
                                <Appointment
                                onClickDelete={()=> handleAppointmentDeleteClick(appointment)} 
                                onClickEdit={()=>handleAppointmentEditClick(appointment)} 
                                key={appointment.id} 
                                data={appointment} />
                            )
                        }
                    })}
                </div>
                <div className="card">
                    <h1>Próximo mês</h1>
                    { appointments.length>0 && appointments.map(appointment => {
                        if(appointment.mes === nextMonth && appointment.ano === year ){
                            return(
                                <Appointment
                                onClickDelete={()=> handleAppointmentDeleteClick(appointment)} 
                                onClickEdit={()=>handleAppointmentEditClick(appointment)} 
                                key={appointment.id} 
                                data={appointment} />
                            )
                        }
                    })}
                </div>
                <div className="card">
                    <h1>Seguintes</h1>
                    { appointments.length>0 && appointments.map(appointment => {
                        if(appointment.mes > nextMonth ){
                            return(
                                <Appointment
                                onClickDelete={()=> handleAppointmentDeleteClick(appointment)} 
                                onClickEdit={()=>handleAppointmentEditClick(appointment)} 
                                key={appointment.id} 
                                data={appointment} />
                            )
                        }
                    })}
                </div>
            </main>

            {modalVissible && (
                <div className="overlay">
                    <div className="modal">
                        <header>
                            <span>{modalType==="add"? 'Nova consulta': modalType=="update"? 'Atualizar consulta': modalType==="delete"?'Deletar consulta?': 'Informações do usuário' }</span>
                            <FiX className="closeButton" onClick={()=>setModalVisible(false)} color="#F54A4A" size={24} />
                        </header>
                        {modalType ==='add' || modalType==='update'? (
                            <Formik
                            initialValues={modalType==="add"? 
                            {name:'', date:'', time:'', price:''} : 
                            {name: selectedAppointment.nome, date: `${selectedAppointment.ano}-${selectedAppointment.mes}-${selectedAppointment.dia}`, time:`${ selectedAppointment.hora}:${selectedAppointment.minutos}`, price: selectedAppointment.preco}}
                            onSubmit={values => modalType==="add"? createAppointment(values) : 
                            updateAppointment(values)} 
                            >
                               {({
                                   handleChange,
                                   handleSubmit,
                                   values,
                                   errors
                               })=>(
                                <form>
                                        <div className="content">
                                            <div className="leftSideContent">
                                                <label>Nome</label>
                                                <input name="name" value={values.name} onChange={handleChange} />
                                                <label>Data:</label>
                                                <input type="date" name="date" value={values.date} onChange={handleChange} />
                                            </div>
                
                                            <div className="rightSideContent">
                                                <label>Preço</label>
                                                <input name="price" value={values.price} onChange={handleChange} />
                                                <label>Hora</label>
                                                <input type="time" name="time" value={values.time} onChange={handleChange} />
                                                    <DarkButton title={modalType==="add"? "Criar consulta": "Atualizar Consulta"} type="submit" action={handleSubmit} />    
                                            </div>
                                        </div>
                                </form>
                               )}
                            </Formik>
                        ): modalType==="user"? (
                            <Formik
                            initialValues={{name:'', weight:'', password:'', confirmPassword:''}}
                            onSubmit={values => handleUpdateUser(values)} 
                            >
                               {({
                                   handleChange,
                                   handleSubmit,
                                   values,
                                   errors
                               })=>(
                                <form>
                                        <div className="content">
                                            <div className="leftSideContent">
                                                <label>Nome</label>
                                                <input name="name" value={values.name} onChange={handleChange} />
                                                <label>Peso:</label>
                                                <input name="weight" value={values.weight} onChange={handleChange} />
                                                <DarkButton title="Atualizar" type="submit" action={handleSubmit} /> 
                                            </div>
                
                                            <div className="rightSideContent">
                                                <label>Senha</label>
                                                <input type="password" name="password" value={values.password} onChange={handleChange} />
                                                <label>Confirmar senha</label>
                                                <input type="password" name="confirmPassword" value={values.confirmPassword} onChange={handleChange} />
                                                <DarkButton id="deleteUser" title="Deletar" type="button" action={handleDeleteUser} />    
                                            </div>
                                        </div>
                                </form>
                               )}
                            </Formik>
                        ):(
                            <>
                                <Appointment data={selectedAppointment} />
                                <DarkButton  title="Sim, deletar" type="submit" action={deleteAppointment} />
                            </>
                        )}
        
                    </div>
                </div>
            )}
        </div>
    )
}