import React from "react";
import PropTypes from "prop-types";
import { Dialog, DialogHeader, DialogBody, DialogFooter, Button } from "@material-tailwind/react";

export default function ConfirmDialog({ open, title, message, confirmText = "Confirm", cancelText = "Cancel", onConfirm, onCancel, confirmColor = "red" }) {
  return (
    <Dialog open={open} handler={onCancel} size="sm" className="">
      <DialogHeader className="text-base font-semibold">{title}</DialogHeader>
      <DialogBody className="text-sm text-blue-gray-600">
        {message}
      </DialogBody>
      <DialogFooter className="gap-2">
        <Button variant="text" color="gray" onClick={onCancel}>
          {cancelText}
        </Button>
        <Button color={confirmColor} onClick={onConfirm}>
          {confirmText}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.node.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  confirmColor: PropTypes.string,
};
