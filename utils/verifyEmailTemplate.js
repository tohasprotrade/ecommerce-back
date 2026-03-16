const verifyEmailTemplate = ({ name, otp })=>{
    return `
<div>
    <p>Dear, ${name}</p>
    <p>Thank you for registering. Please use following OTP code to verify your email.</p>
    <div style="background:yellow; font-size:20px;padding:20px;text-align:center;font-weight : 800;">
        ${otp}
    </div>
    <p>This OTP is valid for 1 hour only.</p>
    <br/>
    </br>
    <p>Thanks</p>
    <p>Gram2ghor</p>
</div>
    `
}

export default verifyEmailTemplate
